// src/services/practice.service.js
import {
  createPracticeSet,
  updatePracticeSet,
  getPracticeSetById,
  listMyPracticeSets,
  listPublishedPracticeSets,
  listPracticeCardsBySet,
  createPracticeCard,
  updatePracticeCard,
  deletePracticeCard,
  getDuePracticeCardsForUser,
  upsertPracticeCardProgress
} from '../models/practice.model.js';

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// ===== PRACTICE SETS =====

export async function createPracticeSetService(user, payload) {
  const set = await createPracticeSet(user.id, {
    ...payload
  });

  if (Array.isArray(payload.cards) && payload.cards.length > 0) {
    for (const [index, c] of payload.cards.entries()) {
      await createPracticeCard(set.id, {
        front: c.front,
        back: c.back,
        example: c.example,
        orderIndex: c.orderIndex ?? index
      });
    }
  }

  const cards = await listPracticeCardsBySet(set.id);
  return { ...set, cards };
}

export async function updatePracticeSetService(user, setId, payload) {
  const set = await getPracticeSetById(setId);
  if (!set) throw httpError(404, 'Practice set not found');

  const isAdmin = user.roleName === 'Admin';
  if (!isAdmin && set.owner_id !== user.id) {
    throw httpError(403, 'Not allowed to edit this practice set');
  }

  const updated = await updatePracticeSet(setId, set.owner_id, payload, isAdmin);
  return updated;
}

export async function listMyPracticeSetsService(user, filters) {
  return listMyPracticeSets(user.id, filters);
}

export async function listPublishedPracticeSetsService(filters) {
  return listPublishedPracticeSets(filters);
}

export async function getPracticeSetDetailService(setId) {
  const set = await getPracticeSetById(setId);
  if (!set) throw httpError(404, 'Practice set not found');

  const cards = await listPracticeCardsBySet(setId);
  return { ...set, cards };
}

// ===== CARDS =====

export async function addCardToPracticeSetService(user, setId, payload) {
  const set = await getPracticeSetById(setId);
  if (!set) throw httpError(404, 'Practice set not found');

  const isAdmin = user.roleName === 'Admin';
  if (!isAdmin && set.owner_id !== user.id) {
    throw httpError(403, 'Not allowed to modify cards');
  }

  return createPracticeCard(setId, payload);
}

export async function updatePracticeCardService(user, setId, cardId, payload) {
  const set = await getPracticeSetById(setId);
  if (!set) throw httpError(404, 'Practice set not found');

  const isAdmin = user.roleName === 'Admin';
  if (!isAdmin && set.owner_id !== user.id) {
    throw httpError(403, 'Not allowed to modify cards');
  }

  return updatePracticeCard(cardId, payload);
}

export async function deletePracticeCardService(user, setId, cardId) {
  const set = await getPracticeSetById(setId);
  if (!set) throw httpError(404, 'Practice set not found');

  const isAdmin = user.roleName === 'Admin';
  if (!isAdmin && set.owner_id !== user.id) {
    throw httpError(403, 'Not allowed to delete cards');
  }

  await deletePracticeCard(cardId);
}

// ===== STUDY / REVIEW =====

export async function getStudyCardsService(user, setId, limit) {
  const set = await getPracticeSetById(setId);
  if (!set || !set.published) {
    throw httpError(404, 'Practice set not available');
  }

  const cards = await getDuePracticeCardsForUser(setId, user.id, limit || 20);
  return cards;
}

// tính lịch ôn – kiểu SM-2 đơn giản
function calcNextReview(progress, quality) {
  const now = new Date();

  let ef = progress?.efactor || 2.5;
  let interval = progress?.interval_days || 0;
  let easeCount = progress?.ease_count || 0;

  ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ef < 1.3) ef = 1.3;

  if (quality < 3) {
    interval = 1;
    easeCount = 0;
  } else {
    if (interval === 0) interval = 1;
    else if (interval === 1) interval = 3;
    else interval = Math.round(interval * ef);
    easeCount += 1;
  }

  const nextReview = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  return {
    efactor: ef,
    intervalDays: interval,
    nextReviewAt: nextReview,
    easeCount
  };
}

export async function reviewPracticeCardService(user, setId, cardId, quality) {
  const set = await getPracticeSetById(setId);
  if (!set || !set.published) {
    throw httpError(404, 'Practice set not available');
  }

  const update = calcNextReview(null, quality);
  await upsertPracticeCardProgress(user.id, cardId, update);

  return { ok: true, nextReviewAt: update.nextReviewAt };
}
