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
  reviewPracticeCardService,
  deletePracticeSetService,
  publishPracticeSetService,
  listPracticeCardsInSetService,
  getPracticeCardDetailService,
  getTeacherPracticeSetDetailService
} from '../services/practice.service.js';

// ===== QUIZ (PRACTICE SET) =====

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
    const data = await updatePracticeSetService(
      req.user,
      req.params.setId,
      req.body
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function deletePracticeSet(req, res, next) {
  try {
    await deletePracticeSetService(req.user, req.params.setId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function publishPracticeSet(req, res, next) {
  try {
    const { published } = req.body;
    if (typeof published !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'published must be boolean'
      });
    }

    const data = await publishPracticeSetService(
      req.user,
      req.params.setId,
      published
    );
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
    const data = await getPracticeSetDetailService(
      req.user,
      req.params.setId
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getTeacherPracticeSetDetail(req, res, next) {
  try {
    const data = await getTeacherPracticeSetDetailService(
      req.user,
      req.params.setId
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ===== CARDS TRONG QUIZ =====

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

export async function listPracticeCardsInSet(req, res, next) {
  try {
    const data = await listPracticeCardsInSetService(
      req.user,
      req.params.setId
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getPracticeCardDetail(req, res, next) {
  try {
    const data = await getPracticeCardDetailService(
      req.user,
      req.params.setId,
      req.params.cardId
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ===== STUDY + REVIEW =====

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
