// src/controllers/practice.controller.js
import {
  createPracticeSetService,
  updatePracticeSetService,
  listMyPracticeSetsService,
  listPublishedPracticeSetsService,
  getPracticeSetDetailService,
  addCardToPracticeSetService,
  updatePracticeCardService,
  deletePracticeCardService,
  getStudyCardsService,
  reviewPracticeCardService
} from '../services/practice.service.js';

export async function createPracticeSet(req, res, next) {
  try {
    const data = await createPracticeSetService(req.user, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updatePracticeSet(req, res, next) {
  try {
    const data = await updatePracticeSetService(req.user, req.params.setId, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listMyPracticeSets(req, res, next) {
  try {
    const data = await listMyPracticeSetsService(req.user, req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listPublishedPracticeSets(req, res, next) {
  try {
    const data = await listPublishedPracticeSetsService(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getPracticeSetDetail(req, res, next) {
  try {
    const data = await getPracticeSetDetailService(req.params.setId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function addCardToPracticeSet(req, res, next) {
  try {
    const data = await addCardToPracticeSetService(
      req.user,
      req.params.setId,
      req.body
    );
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updatePracticeCard(req, res, next) {
  try {
    const data = await updatePracticeCardService(
      req.user,
      req.params.setId,
      req.params.cardId,
      req.body
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function deletePracticeCard(req, res, next) {
  try {
    await deletePracticeCardService(
      req.user,
      req.params.setId,
      req.params.cardId
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getStudyCards(req, res, next) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const data = await getStudyCardsService(req.user, req.params.setId, limit);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function reviewPracticeCard(req, res, next) {
  try {
    const { quality } = req.body;
    const data = await reviewPracticeCardService(
      req.user,
      req.params.setId,
      req.params.cardId,
      quality
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
