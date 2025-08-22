import express from 'express';
import { getRoot, getSetup } from '../controllers/root.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Informational
 *   description: Endpoints that provide information about the API and its setup.
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get API information
 *     tags: [Informational]
 *     description: Returns a welcome message and basic information about the API, including available endpoints.
 *     responses:
 *       200:
 *         description: A JSON object with API information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: UNEP Air Quality Platform - Simplified Mode
 *                 description:
 *                   type: string
 *                   example: Direct API integration without database dependencies
 */
router.get('/', getRoot);

/**
 * @swagger
 * /setup:
 *   get:
 *     summary: Get API setup guide
 *     tags: [Informational]
 *     description: Returns a JSON object with a quick setup guide for the application, including requirements and steps.
 *     responses:
 *       200:
 *         description: A JSON object with setup instructions.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 title:
 *                   type: string
 *                   example: UNEP Air Quality Platform - Quick Setup Guide
 *                 steps:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/setup', getSetup);

export default router;
