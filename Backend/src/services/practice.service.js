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
  upsertPracticeCardProgress,
  deletePracticeSet,
  getPracticeCardById
} from '../models/practice.model.js';

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// ===== QUIZ (PRACTICE SET) =====

export async function createPracticeSetService(user, payload) {
  // Chỉ tạo quiz, KHÔNG tạo cards kèm theo nữa
  const set = await createPracticeSet(user.id, {
    ...payload
  });

  // Luồng mới: luôn tạo quiz trước, sau đó dùng API cards để thêm card
  return { ...set, cards: [] };
}

export async function updatePracticeSetService(user, setId, payload) {
  const set = await getPracticeSetById(setId);
  if (!set) throw httpError(404, 'Practice set not found');

  const isAdmin = user.roleName === 'Admin';
  if (!isAdmin && set.owner_id !== user.id) {
    throw httpError(403, 'Not allowed to edit this practice set');
  }

  const updated = await updatePracticeSet(
    setId,
    set.owner_id,
    payload,
    isAdmin
  );
  return updated;
}

export async function deletePracticeSetService(user, setId) {
  const set = await getPracticeSetById(setId);
  if (!set) throw httpError(404, 'Practice set not found');

  const isAdmin = user.roleName === 'Admin';
  if (!isAdmin && set.owner_id !== user.id) {
    throw httpError(403, 'Not allowed to delete this practice set');
  }

  await deletePracticeSet(setId, set.owner_id, isAdmin);
}

export async function publishPracticeSetService(user, setId, published) {
  const set = await getPracticeSetById(setId);
  if (!set) throw httpError(404, 'Practice set not found');

  const isAdmin = user.roleName === 'Admin';
  if (!isAdmin && set.owner_id !== user.id) {
    throw httpError(403, 'Not allowed to publish this practice set');
  }

  const updated = await updatePracticeSet(
    setId,
    set.owner_id,
    { published },
    isAdmin
  );
  return updated;
}

export async function listMyPracticeSetsService(user, filters) {
  return listMyPracticeSets(user.id, filters);
}

export async function listPublishedPracticeSetsService(filters) {
  return listPublishedPracticeSets(filters);
}

export async function getPracticeSetDetailService(user, setId) {
  const set = await getPracticeSetById(setId);
  if (!set) throw httpError(404, 'Practice set not found');

  const isAdmin = user.roleName === 'Admin';
  const isOwner =
    String(set.owner_id).toLowerCase() === String(user.id).toLowerCase();

  // Member hoặc người ngoài chỉ xem được khi quiz đã publish
  if (!set.published && !isAdmin && !isOwner) {
    throw httpError(403, 'Not allowed to view this practice set');
  }

  const cards = await listPracticeCardsBySet(setId);
  return { ...set, cards };
}

export async function getTeacherPracticeSetDetailService(user, setId) {
  const set = await getPracticeSetById(setId);
  if (!set) throw httpError(404, 'Practice set not found');

  const isAdmin = user.roleName === 'Admin';
  const isOwner =
    String(set.owner_id).toLowerCase() === String(user.id).toLowerCase();

  // Giáo viên chỉ xem được quiz của mình (hoặc Admin xem tất cả)
  if (!isAdmin && !isOwner) {
    throw httpError(403, 'Not allowed to view this practice set');
  }

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

export async function updatePracticeCardService(
  user,
  setId,
  cardId,
  payload
) {
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

export async function listPracticeCardsInSetService(user, setId) {
  const set = await getPracticeSetById(setId);
  if (!set) throw httpError(404, 'Practice set not found');

  const isAdmin = user.roleName === 'Admin';
  const isOwner =
    String(set.owner_id).toLowerCase() === String(user.id).toLowerCase();

  if (!isAdmin && !isOwner) {
    throw httpError(403, 'Not allowed to view cards in this set');
  }

  const cards = await listPracticeCardsBySet(setId);
  return cards;
}

export async function getPracticeCardDetailService(user, setId, cardId) {
  const set = await getPracticeSetById(setId);
  if (!set) throw httpError(404, 'Practice set not found');

  const isAdmin = user.roleName === 'Admin';
  const isOwner =
    String(set.owner_id).toLowerCase() === String(user.id).toLowerCase();

  if (!isAdmin && !isOwner && !set.published) {
    throw httpError(403, 'Not allowed to view this card');
  }

  const card = await getPracticeCardById(cardId);
  if (
    !card ||
    String(card.deck_id).toLowerCase() !== String(setId).toLowerCase()
  ) {
    throw httpError(404, 'Card not found');
  }

  return card;
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

// Tính lịch ôn – SM-2 đơn giản
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
