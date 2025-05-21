import {addEvent, updateEvent, deleteEvent} from '../controllers/events.controllers.js';
import { Router } from 'express';

const router = Router();

// Route to add a new event
router.post("/addEvent", addEvent);
// Route to update an existing event
router.patch("/updateEvent/:id", updateEvent);
// Route to delete an event
router.delete("/deleteEvent/:id", deleteEvent);

export default router;
