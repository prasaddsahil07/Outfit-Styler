import { Event } from '../models/events.models.js';
// import { ai } from "../index.js";
// import { Modality } from "@google/genai";
// import path from "path";
// import fs from "fs";
// import { User } from "../models/users.models.js";

export const addEvent = async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const userId = user._id;
        const {
            title,
            occasion,
            start_date,
            end_date,
            is_multi_day,
            event_name,        // For multi-day events (top-level eventName)
            // event_type,        // For single-day events (but not stored as eventName anymore)
            time,
            location,
            description,
            reminder,
            reminder_value,
            reminder_type,
            day_specific_data
        } = req.body;

        const eventData = {
            userId,
            title,
            occasion,
            startDate: new Date(start_date),
            endDate: new Date(end_date),
            isMultiDay: is_multi_day,
        };

        if (is_multi_day) {
            // Handle multi-day event
            eventData.eventName = event_name; // Set top-level eventName for multi-day events
            eventData.daySpecificData = Object.entries(day_specific_data).map(([dateStr, data]) => ({
                date: new Date(dateStr),
                eventName: data.event,
                eventTime: data.time,
                location: data.location,
                description: data.description,
                reminder: {
                    value: data.reminderValue,
                    type: data.reminderType,
                    text: data.reminder,
                    isSent: false
                }
            }));
        } else {
            // Handle single-day event
            // Note: eventName is NOT set for single-day events as per updated schema
            eventData.eventTime = time;
            eventData.location = location;
            eventData.description = description;
            eventData.reminder = {
                value: reminder_value,
                type: reminder_type,
                text: reminder,
                isSent: false
            };
        }

        const event = new Event(eventData);
        await event.save();
        
        res.status(201).json({
            message: 'Event created successfully',
            event: event
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(400).json({ error: error.message });
    }
};

export const updateEvent = async (req, res) => {
    const { id } = req.params;
    const {
        title,
        occasion,
        start_date,
        end_date,
        is_multi_day,
        event_type,
        time,
        location,
        description,
        reminder,
        reminder_value,
        reminder_type,
        day_specific_data,
        isStyled,
        generatedImages
    } = req.body;

    try {
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to update this event' });
        }

        // Base event data update
        const updatedFields = {
            title: title || event.title,
            occasion: occasion || event.occasion,
            startDate: start_date ? new Date(start_date) : event.startDate,
            endDate: end_date ? new Date(end_date) : event.endDate,
            isMultiDay: is_multi_day !== undefined ? is_multi_day : event.isMultiDay,
            isStyled: isStyled !== undefined ? isStyled : event.isStyled,
            generatedImages: generatedImages || event.generatedImages
        };

        // Handle event type specific updates
        if (updatedFields.isMultiDay) {
            // Update multi-day event data
            if (day_specific_data) {
                updatedFields.daySpecificData = Object.entries(day_specific_data).map(([dateStr, data]) => ({
                    date: new Date(dateStr),
                    eventName: data.event,
                    eventTime: data.time,
                    location: data.location,
                    description: data.description,
                    reminder: {
                        value: data.reminderValue,
                        type: data.reminderType,
                        text: data.reminder,
                        isSent: false // Reset reminder status on update
                    }
                }));
            }
            
            // Clear single-day fields for multi-day events
            updatedFields.eventName = undefined;
            updatedFields.eventTime = undefined;
            updatedFields.location = undefined;
            updatedFields.description = undefined;
            updatedFields.reminder = undefined;
        } else {
            // Update single-day event data
            updatedFields.eventName = event_type || event.eventName;
            updatedFields.eventTime = time || event.eventTime;
            updatedFields.location = location || event.location;
            updatedFields.description = description || event.description;
            
            if (reminder || reminder_value || reminder_type) {
                updatedFields.reminder = {
                    value: reminder_value || event.reminder?.value || 1,
                    type: reminder_type || event.reminder?.type || 'Days before',
                    text: reminder || event.reminder?.text || '1 day before',
                    isSent: false // Reset reminder status on update
                };
            }
            
            // Clear multi-day fields for single-day events
            updatedFields.daySpecificData = [];
        }

        const updatedEvent = await Event.findByIdAndUpdate(id, updatedFields, { 
            new: true,
            runValidators: true 
        });

        if (!updatedEvent) {
            return res.status(404).json({ message: 'Event not found after update' });
        }

        res.status(200).json({ 
            message: 'Event updated successfully', 
            event: updatedEvent 
        });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ message: 'Error updating event', error: error.message });
    }
};

export const deleteEvent = async (req, res) => {
    const { id } = req.params;

    try {
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to delete this event' });
        }

        // Delete the event
        await Event.findByIdAndDelete(id);

        // Remove the event reference from the user's events array if you have one
        // try {
        //     await User.findByIdAndUpdate(event.userId, {
        //         $pull: { events: id }
        //     });
        // } catch (userUpdateError) {
        //     console.warn('Could not update user events array:', userUpdateError.message);
        //     // Continue with successful event deletion even if user update fails
        // }

        return res.status(200).json({ 
            message: 'Event deleted successfully',
            deletedEventId: id 
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        return res.status(500).json({ message: 'Error deleting event', error: error.message });
    }
};

// export const fetchAllEvents = async (req, res) => {
//     try {
//         const user = req.user;
//         if (!user) {
//             return res.status(401).json({ message: 'Unauthorized' });
//         }

//         // Add query parameters for filtering
//         const { 
//             startDate, 
//             endDate, 
//             occasion, 
//             isMultiDay,
//             page = 1,
//             limit = 50
//         } = req.query;

//         let query = { userId: user._id };

//         // Add filters if provided
//         if (startDate || endDate) {
//             query.startDate = {};
//             if (startDate) query.startDate.$gte = new Date(startDate);
//             if (endDate) query.startDate.$lte = new Date(endDate);
//         }

//         if (occasion) {
//             query.occasion = { $regex: occasion, $options: 'i' };
//         }

//         if (isMultiDay !== undefined) {
//             query.isMultiDay = isMultiDay === 'true';
//         }

//         const skip = (parseInt(page) - 1) * parseInt(limit);

//         const events = await Event.find(query)
//             .sort({ startDate: 1 }) // Sort by start date ascending
//             .skip(skip)
//             .limit(parseInt(limit));

//         const totalEvents = await Event.countDocuments(query);

//         if (!events || events.length === 0) {
//             return res.status(200).json({ 
//                 message: 'No events found',
//                 events: [],
//                 pagination: {
//                     currentPage: parseInt(page),
//                     totalPages: 0,
//                     totalEvents: 0,
//                     hasNextPage: false,
//                     hasPrevPage: false
//                 }
//             });
//         }

//         const totalPages = Math.ceil(totalEvents / parseInt(limit));

//         return res.status(200).json({ 
//             message: 'Events fetched successfully', 
//             events,
//             pagination: {
//                 currentPage: parseInt(page),
//                 totalPages,
//                 totalEvents,
//                 hasNextPage: parseInt(page) < totalPages,
//                 hasPrevPage: parseInt(page) > 1
//             }
//         });
//     } catch (error) {
//         console.error("Error fetching events:", error.message);
//         return res.status(500).json({ message: 'Error fetching events', error: error.message });
//     }
// };

export const getEventDetails = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ message: 'Event ID is required' });
        }

        const eventDetails = await Event.findById(id);
        
        if (!eventDetails) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (eventDetails.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to view this event' });
        }

        return res.status(200).json({ 
            message: 'Event details fetched successfully', 
            event: eventDetails 
        });
    } catch (error) {
        console.error("Error fetching event details:", error.message);
        return res.status(500).json({ message: 'Error fetching event details', error: error.message });
    }
};

export const getUpcomingEvents = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // const { limit = 10 } = req.query;
        const currentDate = new Date();

        const upcomingEvents = await Event.find({
            userId: user._id,
            startDate: { $gte: currentDate }
        })
        .sort({ startDate: 1 });
        // .limit(parseInt(limit));

        return res.status(200).json({
            message: 'Upcoming events fetched successfully',
            events: upcomingEvents
        });
    } catch (error) {
        console.error("Error fetching upcoming events:", error.message);
        return res.status(500).json({ message: 'Error fetching upcoming events', error: error.message });
    }
};

// export const markReminderAsSent = async (req, res) => {
//     try {
//         const { eventId } = req.params;
//         const { dayDate } = req.body; // For multi-day events

//         const event = await Event.findById(eventId);
        
//         if (!event) {
//             return res.status(404).json({ message: 'Event not found' });
//         }

//         if (event.userId.toString() !== req.user._id.toString()) {
//             return res.status(403).json({ message: 'Unauthorized' });
//         }

//         if (event.isMultiDay && dayDate) {
//             // Mark specific day reminder as sent
//             const dayIndex = event.daySpecificData.findIndex(
//                 day => day.date.toISOString().split('T')[0] === new Date(dayDate).toISOString().split('T')[0]
//             );
            
//             if (dayIndex !== -1) {
//                 event.daySpecificData[dayIndex].reminder.isSent = true;
//             }
//         } else {
//             // Mark single-day event reminder as sent
//             event.reminder.isSent = true;
//         }

//         await event.save();

//         return res.status(200).json({
//             message: 'Reminder marked as sent',
//             event
//         });
//     } catch (error) {
//         console.error("Error marking reminder as sent:", error.message);
//         return res.status(500).json({ message: 'Error updating reminder status', error: error.message });
//     }
// };


// function buildOutfitPrompt(occasion, dayTime, description, userBodyInfo) {
//     const bodyShape = userBodyInfo?.bodyShapeAnalysis.bodyShape.classification || "not specified";
//     const skinTone = userBodyInfo?.bodyShapeAnalysis.skinTone.toneCategory || "not specified";
//     const gender = userBodyInfo?.bodyShapeAnalysis.gender.classification || "not specified";
//     const desc = description?.trim() 
//         ? `Additional styling notes: ${description.trim()}.` 
//         : "Focus on classic, versatile styling suitable for everyday wear.";

//     return `
//         You are a professional fashion stylist and visual designer. Your task is to generate a **photorealistic, magazine-quality outfit image** based on the user's profile and occasion. Design a full outfit that is cohesive, stylish, and wearable.

//         👤 USER PROFILE:
//         - Body shape: ${bodyShape}
//         - Skin tone: ${skinTone}
//         - Gender: ${gender}

//         📅 CONTEXT:
//         - Occasion: ${occasion || "everyday wear"}
//         - Time of day: ${dayTime || "anytime"}
//         - ${desc}

//         👗 OUTFIT DESIGN:
//         - Include: top, bottom, shoes, and accessories (bag, jewelry, scarf, etc.)
//         - Color and fabric choices should suit skin tone and occasion
//         - Make it season-appropriate and culturally sensitive
//         - The overall outfit must be harmonious, flattering, and elegant
//         - Ensure each piece fits well and complements body shape

//         🖼️ VISUAL STYLE:
//         - High-resolution, clear fabric details
//         - Natural, soft lighting with gentle shadows
//         - Neutral background (light gray, beige, or off-white)
//         - Position outfit clearly to showcase all components

//         ✨ STYLE DIRECTION:
//         - Blend timeless elegance with a modern twist
//         - Colors should be balanced and fashion-forward
//         - Add tasteful styling elements that elevate the look
//         - Prioritize comfort, functionality, and real-world wearability

//         Final goal: A visually stunning, realistic outfit that aligns with user traits and the specific occasion. The result should look like it belongs on the cover of a fashion magazine.
//     `.replace(/\s+/g, ' ').trim();
// }

// async function generateOutfitAsPerRequirements(occasion, dayTime, description, userBodyInfo) {
//     try {
//         const prompt = buildOutfitPrompt(occasion, dayTime, description, userBodyInfo);

//         const response = await ai.models.generateContent({
//             model: "gemini-2.0-flash-preview-image-generation",
//             contents: prompt,
//             config: {
//                 responseModalities: [Modality.TEXT, Modality.IMAGE],
//             },
//         });

//         const result = {
//             textDescription: "",
//             imageUrl: "",
//             status: "success",
//         };

//         for (const part of response.candidates[0].content.parts) {
//             if (part.text) {
//                 result.textDescription = part.text;
//             } else if (part.inlineData) {
//                 const imageDataB64 = part.inlineData.data;
//                 const buffer = Buffer.from(imageDataB64, "base64");

//                 // Ensure folder exists
//                 const imagesDir = path.join("static", "images");
//                 fs.mkdirSync(imagesDir, { recursive: true });

//                 const filename = `outfit_${Date.now()}.png`;
//                 const filepath = path.join(imagesDir, filename);
//                 fs.writeFileSync(filepath, buffer);

//                 // Set accessible image URL
//                 result.imageUrl = `/static/images/${filename}`;
//             }
//         }

//         return {
//             success: true,
//             data: result,
//         };

//     } catch (error) {
//         console.error("Generation Error:", error);
//         return {
//             success: false,
//             error: error.message,
//         };
//     }
// }

// export const styleForEvent = async (req, res) => {
//     try {
//         const event = await Event.findById(req.params.id);
//         if (!event) {
//             return res.status(404).json({ message: 'Event not found' });
//         }

//         const userId = req.user._id;
//         // Check if the user is authorized to style this event
//         if(event.userId.toString() !== userId.toString()) {
//             return res.status(403).json({ message: 'Unauthorized to style this event' });
//         }

//         const userBodyInfo = req.user.userBodyInfo;

//         // fetch user body data here to give more personalized outfit

//         if (!event.isStyled || !event.generatedImages || event.generatedImages.length === 0) {
//             const genResult = await generateOutfitAsPerRequirements(
//                 event.occasion,
//                 event.dayTime,
//                 event.description,
//                 userBodyInfo
//             );

//             // console.log("GEN RESULT:", genResult);

//             if (!genResult.success || !genResult.data?.imageUrl) {
//                 return res.status(500).json({ message: 'Error generating outfit' });
//             }

//             // Save the image as base64 or link to image hosting
//             event.isStyled = true;
//             event.generatedImages = [genResult.data.imageUrl];
//             await event.save();

//             return res.status(200).json({
//                 message: 'Event styled successfully',
//                 description: genResult.data.textDescription,
//                 images: event.generatedImages,
//             });
//         }

//         return res.status(200).json({
//             message: 'Event already styled',
//             images: event.generatedImages,
//         });
//     } catch (error) {
//         console.error("Error styling event:", error.message);
//         return res.status(500).json({ message: 'Error styling event', error: error.message });
//     }
// };