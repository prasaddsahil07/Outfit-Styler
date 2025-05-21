import {addEvent, updateEvent, deleteEvent, getEventDetails, styleForEvent} from '../controllers/events.controllers.js';
import { Router } from 'express';

const router = Router();

// Route to add a new event
router.post("/addEvent", addEvent);
// Route to update an existing event
router.patch("/updateEvent/:id", updateEvent);
// Route to delete an event
router.delete("/deleteEvent/:id", deleteEvent);
// Route to get details of an event
router.get("/getEventDetails/:id", getEventDetails);
// Route to get styled images for an event
router.post("/styleForEvent/:id", styleForEvent);

export default router;
