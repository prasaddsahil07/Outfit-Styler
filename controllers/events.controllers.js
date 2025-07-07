// import { Event } from '../models/events.models.js';

// export const addEvent = async (req, res) => {
//     const user = req.user;
//     if (!user) {
//         return res.status(401).json({ message: 'Unauthorized' });
//     }

//     try {
//         const userId = user._id;
//         const {
//             title,
//             occasion,
//             start_date,
//             end_date,
//             is_multi_day,
//             event_name,        // For multi-day events
//             time,              // For single-day events
//             location,          // For single-day events
//             description,       // For single-day events
//             reminder,
//             reminder_value,
//             reminder_type,
//             day_specific_data,
//             timezone
//         } = req.body;

//         const eventData = {
//             userId,
//             title,
//             occasion,
//             startDate: new Date(start_date),
//             endDate: new Date(end_date),
//             isMultiDay: is_multi_day,
//             timezone: timezone || 'UTC'
//         };

//         if (is_multi_day) {
//             // Handle multi-day event
//             eventData.daySpecificData = Object.entries(day_specific_data).map(([dateStr, data]) => ({
//                 date: new Date(dateStr),
//                 eventName: data.event,
//                 eventTime: data.time,
//                 location: data.location,
//                 description: data.description,
//                 reminder: {
//                     value: data.reminderValue || 1,
//                     type: data.reminderType || 'Days before',
//                     text: data.reminder || '1 day before',
//                     isSent: false
//                 }
//             }));
//         } else {
//             // Handle single-day event using singleDayDetails
//             eventData.singleDayDetails = {
//                 eventTime: time,
//                 location: location,
//                 description: description,
//                 reminder: {
//                     value: reminder_value || 1,
//                     type: reminder_type || 'Days before',
//                     text: reminder || '1 day before',
//                     isSent: false
//                 }
//             };
//         }

//         const event = new Event(eventData);
//         await event.save();
        
//         res.status(201).json({
//             message: 'Event created successfully',
//             event: event
//         });
//     } catch (error) {
//         console.error('Error creating event:', error);
//         res.status(400).json({ error: error.message });
//     }
// };

// // Keep the getMultiDayEventCollection as is - this is unique
// export const getMultiDayEventCollection = async (req, res) => {
//     try {
//         const { id } = req.params; // Multi-day event ID
//         const user = req.user;
        
//         if (!user) {
//             return res.status(401).json({ message: 'Unauthorized' });
//         }

//         if (!id) {
//             return res.status(400).json({ message: 'Multi-day event ID is required' });
//         }

//         const multiDayEvent = await Event.findById(id);
        
//         if (!multiDayEvent) {
//             return res.status(404).json({ message: 'Multi-day event not found' });
//         }

//         if (multiDayEvent.userId.toString() !== user._id.toString()) {
//             return res.status(403).json({ message: 'Unauthorized to view this event' });
//         }

//         if (!multiDayEvent.isMultiDay) {
//             return res.status(400).json({ message: 'This is not a multi-day event' });
//         }

//         // Extract day events and add parent event info
//         const dayEvents = multiDayEvent.daySpecificData.map(dayEvent => ({
//             dayEventId: dayEvent._id,
//             parentEventId: multiDayEvent._id,
//             parentTitle: multiDayEvent.title,
//             parentOccasion: multiDayEvent.occasion,
//             date: dayEvent.date,
//             eventName: dayEvent.eventName,
//             eventTime: dayEvent.eventTime,
//             location: dayEvent.location,
//             description: dayEvent.description,
//             reminder: dayEvent.reminder,
//             daySpecificImage: dayEvent.daySpecificImage,
//             isStyled: multiDayEvent.isStyled,
//             generatedImages: multiDayEvent.generatedImages
//         }));

//         // Sort by date
//         dayEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

//         return res.status(200).json({
//             message: 'Multi-day event collection fetched successfully',
//             parentEvent: {
//                 id: multiDayEvent._id,
//                 title: multiDayEvent.title,
//                 occasion: multiDayEvent.occasion,
//                 startDate: multiDayEvent.startDate,
//                 endDate: multiDayEvent.endDate,
//                 isStyled: multiDayEvent.isStyled,
//                 generatedImages: multiDayEvent.generatedImages
//             },
//             dayEvents: dayEvents,
//             totalDayEvents: dayEvents.length
//         });
//     } catch (error) {
//         console.error("Error fetching multi-day event collection:", error.message);
//         return res.status(500).json({ 
//             message: 'Error fetching multi-day event collection', 
//             error: error.message 
//         });
//     }
// };

// // Modified getEventDetails to handle both single events and day events
// export const getEventDetails = async (req, res) => {
//     try {
//         const { id, dayEventId } = req.params; // id = event ID, dayEventId = optional day event ID
        
//         if (!id) {
//             return res.status(400).json({ message: 'Event ID is required' });
//         }

//         const event = await Event.findById(id);
        
//         if (!event) {
//             return res.status(404).json({ message: 'Event not found' });
//         }

//         if (event.userId.toString() !== req.user._id.toString()) {
//             return res.status(403).json({ message: 'Unauthorized to view this event' });
//         }

//         // If dayEventId is provided, return specific day event details
//         if (dayEventId) {
//             if (!event.isMultiDay) {
//                 return res.status(400).json({ message: 'This is not a multi-day event' });
//             }

//             const dayEvent = event.daySpecificData.id(dayEventId);
            
//             if (!dayEvent) {
//                 return res.status(404).json({ message: 'Day event not found' });
//             }

//             // Return day event details with parent context
//             const dayEventDetails = {
//                 _id: dayEvent._id, // Keep this for consistency
//                 parentEventId: event._id,
//                 parentTitle: event.title,
//                 parentOccasion: event.occasion,
//                 parentStartDate: event.startDate,
//                 parentEndDate: event.endDate,
                
//                 // Day-specific details (structure similar to single-day events)
//                 title: dayEvent.eventName, // Map eventName to title for consistency
//                 date: dayEvent.date,
//                 eventTime: dayEvent.eventTime,
//                 location: dayEvent.location,
//                 description: dayEvent.description,
//                 reminder: dayEvent.reminder,
//                 daySpecificImage: dayEvent.daySpecificImage,
                
//                 // Indicate this is a day event
//                 isDayEvent: true,
//                 isMultiDay: false, // For frontend logic consistency
                
//                 // Parent styling
//                 isStyled: event.isStyled,
//                 generatedImages: event.generatedImages,
//                 timezone: event.timezone,
//                 createdAt: event.createdAt,
//                 updatedAt: event.updatedAt
//             };

//             return res.status(200).json({ 
//                 message: 'Day event details fetched successfully', 
//                 event: dayEventDetails 
//             });
//         }

//         // Return regular event details (single-day or full multi-day)
//         return res.status(200).json({ 
//             message: 'Event details fetched successfully', 
//             event: event 
//         });
//     } catch (error) {
//         console.error("Error fetching event details:", error.message);
//         return res.status(500).json({ message: 'Error fetching event details', error: error.message });
//     }
// };

// // Modified updateEvent to handle both single events and day events
// export const updateEvent = async (req, res) => {
//     try {
//     const { id, dayEventId } = req.params; // id = event ID, dayEventId = optional day event ID
//     const {
//         title,
//         occasion,
//         start_date,
//         end_date,
//         is_multi_day,
//         eventName, // For day events
//         time,
//         location,
//         description,
//         reminder,
//         reminder_value,
//         reminder_type,
//         day_specific_data,
//         isStyled,
//         generatedImages,
//         timezone,
//         daySpecificImage
//     } = req.body;

//         const event = await Event.findById(id);
//         if (!event) {
//             return res.status(404).json({ message: 'Event not found' });
//         }

//         if (event.userId.toString() !== req.user._id.toString()) {
//             return res.status(403).json({ message: 'Unauthorized to update this event' });
//         }

//         // If dayEventId is provided, update specific day event
//         if (dayEventId) {
//             if (!event.isMultiDay) {
//                 return res.status(400).json({ message: 'This is not a multi-day event' });
//             }

//             const dayEvent = event.daySpecificData.id(dayEventId);
            
//             if (!dayEvent) {
//                 return res.status(404).json({ message: 'Day event not found' });
//             }

//             // Update day event fields
//             if (eventName) dayEvent.eventName = eventName;
//             if (time) dayEvent.eventTime = time;
//             if (location) dayEvent.location = location;
//             if (description !== undefined) dayEvent.description = description;
//             if (daySpecificImage !== undefined) dayEvent.daySpecificImage = daySpecificImage;
            
//             // Update reminder if provided
//             if (reminder || reminder_value || reminder_type) {
//                 dayEvent.reminder = {
//                     value: reminder_value || dayEvent.reminder.value,
//                     type: reminder_type || dayEvent.reminder.type,
//                     text: reminder || dayEvent.reminder.text,
//                     isSent: false
//                 };
//             }

//             await event.save();

//             return res.status(200).json({
//                 message: 'Day event updated successfully',
//                 event: dayEvent
//             });
//         }

//         // Regular event update logic (your existing code)
//         const updatedFields = {
//             title: title || event.title,
//             occasion: occasion || event.occasion,
//             startDate: start_date ? new Date(start_date) : event.startDate,
//             endDate: end_date ? new Date(end_date) : event.endDate,
//             isMultiDay: is_multi_day !== undefined ? is_multi_day : event.isMultiDay,
//             isStyled: isStyled !== undefined ? isStyled : event.isStyled,
//             generatedImages: generatedImages || event.generatedImages,
//             timezone: timezone || event.timezone
//         };

//         if (updatedFields.isMultiDay) {
//             if (day_specific_data) {
//                 updatedFields.daySpecificData = Object.entries(day_specific_data).map(([dateStr, data]) => ({
//                     date: new Date(dateStr),
//                     eventName: data.event,
//                     eventTime: data.time,
//                     location: data.location,
//                     description: data.description,
//                     reminder: {
//                         value: data.reminderValue || 1,
//                         type: data.reminderType || 'Days before',
//                         text: data.reminder || '1 day before',
//                         isSent: false
//                     }
//                 }));
//             }
            
//             updatedFields.singleDayDetails = {
//                 eventTime: undefined,
//                 location: undefined,
//                 description: undefined,
//                 reminder: undefined
//             };
//         } else {
//             updatedFields.singleDayDetails = {
//                 eventTime: time || event.singleDayDetails?.eventTime,
//                 location: location || event.singleDayDetails?.location,
//                 description: description || event.singleDayDetails?.description,
//                 reminder: {
//                     value: reminder_value || event.singleDayDetails?.reminder?.value || 1,
//                     type: reminder_type || event.singleDayDetails?.reminder?.type || 'Days before',
//                     text: reminder || event.singleDayDetails?.reminder?.text || '1 day before',
//                     isSent: false
//                 }
//             };
            
//             updatedFields.daySpecificData = [];
//         }

//         const updatedEvent = await Event.findByIdAndUpdate(id, updatedFields, { 
//             new: true,
//             runValidators: true 
//         });

//         res.status(200).json({ 
//             message: 'Event updated successfully', 
//             event: updatedEvent 
//         });
//     } catch (error) {
//         console.error('Error updating event:', error);
//         res.status(500).json({ message: 'Error updating event', error: error.message });
//     }
// };

// // Modified deleteEvent to handle both single events and day events
// export const deleteEvent = async (req, res) => {
//     const { id, dayEventId } = req.params;

//     try {
//         const event = await Event.findById(id);
//         if (!event) {
//             return res.status(404).json({ message: 'Event not found' });
//         }

//         if (event.userId.toString() !== req.user._id.toString()) {
//             return res.status(403).json({ message: 'Unauthorized to delete this event' });
//         }

//         // If dayEventId is provided, delete specific day event
//         if (dayEventId) {
//             if (!event.isMultiDay) {
//                 return res.status(400).json({ message: 'This is not a multi-day event' });
//             }

//             const dayEvent = event.daySpecificData.id(dayEventId);
            
//             if (!dayEvent) {
//                 return res.status(404).json({ message: 'Day event not found' });
//             }

//             // Check if this is the last day event
//             if (event.daySpecificData.length === 1) {
//                 return res.status(400).json({ 
//                     message: 'Cannot delete the last day event. Delete the entire multi-day event instead.' 
//                 });
//             }

//             // Remove the day event
//             event.daySpecificData.pull(dayEventId);
//             await event.save();

//             return res.status(200).json({
//                 message: 'Day event deleted successfully',
//                 remainingDayEvents: event.daySpecificData.length
//             });
//         }

//         // Delete entire event
//         await Event.findByIdAndDelete(id);

//         return res.status(200).json({ 
//             message: 'Event deleted successfully',
//         });
//     } catch (error) {
//         console.error('Error deleting event:', error);
//         return res.status(500).json({ message: 'Error deleting event', error: error.message });
//     }
// };

// export const getUpcomingEvents = async (req, res) => {
//     try {
//         const user = req.user;
//         if (!user) {
//             return res.status(401).json({ message: 'Unauthorized' });
//         }

//         const currentDate = new Date();

//         const upcomingEvents = await Event.find({
//             userId: user._id,
//             startDate: { $gte: currentDate }
//         })
//         .sort({ startDate: 1 });

//         return res.status(200).json({
//             message: 'Upcoming events fetched successfully',
//             events: upcomingEvents
//         });
//     } catch (error) {
//         console.error("Error fetching upcoming events:", error.message);
//         return res.status(500).json({ message: 'Error fetching upcoming events', error: error.message });
//     }
// };

// // Helper function to get event reminder data (useful for reminder services)
// export const getEventReminders = async (req, res) => {
//     try {
//         const user = req.user;
//         if (!user) {
//             return res.status(401).json({ message: 'Unauthorized' });
//         }

//         const currentDate = new Date();
//         const events = await Event.find({
//             userId: user._id,
//             startDate: { $gte: currentDate }
//         });

//         const reminders = [];

//         events.forEach(event => {
//             if (event.isMultiDay) {
//                 // Handle multi-day event reminders
//                 event.daySpecificData.forEach(dayEvent => {
//                     if (!dayEvent.reminder.isSent) {
//                         reminders.push({
//                             eventId: event._id,
//                             dayEventId: dayEvent._id,
//                             eventName: dayEvent.eventName,
//                             date: dayEvent.date,
//                             reminder: dayEvent.reminder,
//                             isMultiDay: true
//                         });
//                     }
//                 });
//             } else {
//                 // Handle single-day event reminders
//                 if (event.singleDayDetails?.reminder && !event.singleDayDetails.reminder.isSent) {
//                     reminders.push({
//                         eventId: event._id,
//                         eventName: event.title,
//                         date: event.startDate,
//                         reminder: event.singleDayDetails.reminder,
//                         isMultiDay: false
//                     });
//                 }
//             }
//         });

//         return res.status(200).json({
//             message: 'Event reminders fetched successfully',
//             reminders
//         });
//     } catch (error) {
//         console.error("Error fetching event reminders:", error.message);
//         return res.status(500).json({ message: 'Error fetching event reminders', error: error.message });
//     }
// };






import { Event } from '../models/events.models.js';

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
            event_name,        // For multi-day events
            time,              // For single-day events
            location,          // For single-day events
            description,       // For single-day events
            reminder,
            reminder_value,
            reminder_type,
            day_specific_data,
            timezone
        } = req.body;

        const eventData = {
            userId,
            title,
            occasion,
            startDate: new Date(start_date),
            endDate: new Date(end_date),
            isMultiDay: is_multi_day,
            timezone: timezone || 'UTC'
        };

        if (is_multi_day) {
            // Handle multi-day event
            eventData.daySpecificData = Object.entries(day_specific_data).map(([dateStr, data]) => ({
                date: new Date(dateStr),
                eventName: data.event,
                eventTime: data.time,
                location: data.location,
                description: data.description,
                reminder: {
                    value: data.reminderValue || 1,
                    type: data.reminderType || 'Days before',
                    text: data.reminder || '1 day before',
                    isSent: false
                },
                // Handle daySpecificImage as array
                daySpecificImage: Array.isArray(data.daySpecificImage) ? data.daySpecificImage : 
                                 (data.daySpecificImage ? [data.daySpecificImage] : [])
            }));
        } else {
            // Handle single-day event using singleDayDetails
            eventData.singleDayDetails = {
                eventTime: time,
                location: location,
                description: description,
                reminder: {
                    value: reminder_value || 1,
                    type: reminder_type || 'Days before',
                    text: reminder || '1 day before',
                    isSent: false
                }
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

// Keep the getMultiDayEventCollection as is - this is unique
export const getMultiDayEventCollection = async (req, res) => {
    try {
        const { id } = req.params; // Multi-day event ID
        const user = req.user;
        
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!id) {
            return res.status(400).json({ message: 'Multi-day event ID is required' });
        }

        const multiDayEvent = await Event.findById(id);
        
        if (!multiDayEvent) {
            return res.status(404).json({ message: 'Multi-day event not found' });
        }

        if (multiDayEvent.userId.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to view this event' });
        }

        if (!multiDayEvent.isMultiDay) {
            return res.status(400).json({ message: 'This is not a multi-day event' });
        }

        // Extract day events and add parent event info
        const dayEvents = multiDayEvent.daySpecificData.map(dayEvent => ({
            dayEventId: dayEvent._id,
            parentEventId: multiDayEvent._id,
            parentTitle: multiDayEvent.title,
            parentOccasion: multiDayEvent.occasion,
            date: dayEvent.date,
            eventName: dayEvent.eventName,
            eventTime: dayEvent.eventTime,
            location: dayEvent.location,
            description: dayEvent.description,
            reminder: dayEvent.reminder,
            daySpecificImage: dayEvent.daySpecificImage, // Already an array
            isStyled: multiDayEvent.isStyled,
            generatedImages: multiDayEvent.generatedImages
        }));

        // Sort by date
        dayEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

        return res.status(200).json({
            message: 'Multi-day event collection fetched successfully',
            parentEvent: {
                id: multiDayEvent._id,
                title: multiDayEvent.title,
                occasion: multiDayEvent.occasion,
                startDate: multiDayEvent.startDate,
                endDate: multiDayEvent.endDate,
                isStyled: multiDayEvent.isStyled,
                generatedImages: multiDayEvent.generatedImages
            },
            dayEvents: dayEvents,
            totalDayEvents: dayEvents.length
        });
    } catch (error) {
        console.error("Error fetching multi-day event collection:", error.message);
        return res.status(500).json({ 
            message: 'Error fetching multi-day event collection', 
            error: error.message 
        });
    }
};

// Modified getEventDetails to handle both single events and day events
export const getEventDetails = async (req, res) => {
    try {
        const { id, dayEventId } = req.params; // id = event ID, dayEventId = optional day event ID
        
        if (!id) {
            return res.status(400).json({ message: 'Event ID is required' });
        }

        const event = await Event.findById(id);
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to view this event' });
        }

        // If dayEventId is provided, return specific day event details
        if (dayEventId) {
            if (!event.isMultiDay) {
                return res.status(400).json({ message: 'This is not a multi-day event' });
            }

            const dayEvent = event.daySpecificData.id(dayEventId);
            
            if (!dayEvent) {
                return res.status(404).json({ message: 'Day event not found' });
            }

            // Return day event details with parent context
            const dayEventDetails = {
                _id: dayEvent._id, // Keep this for consistency
                parentEventId: event._id,
                parentTitle: event.title,
                parentOccasion: event.occasion,
                parentStartDate: event.startDate,
                parentEndDate: event.endDate,
                
                // Day-specific details (structure similar to single-day events)
                title: dayEvent.eventName, // Map eventName to title for consistency
                date: dayEvent.date,
                eventTime: dayEvent.eventTime,
                location: dayEvent.location,
                description: dayEvent.description,
                reminder: dayEvent.reminder,
                daySpecificImage: dayEvent.daySpecificImage, // Already an array
                
                // Indicate this is a day event
                isDayEvent: true,
                isMultiDay: false, // For frontend logic consistency
                
                // Parent styling
                isStyled: event.isStyled,
                generatedImages: event.generatedImages,
                timezone: event.timezone,
                createdAt: event.createdAt,
                updatedAt: event.updatedAt
            };

            return res.status(200).json({ 
                message: 'Day event details fetched successfully', 
                event: dayEventDetails 
            });
        }

        // Return regular event details (single-day or full multi-day)
        return res.status(200).json({ 
            message: 'Event details fetched successfully', 
            event: event 
        });
    } catch (error) {
        console.error("Error fetching event details:", error.message);
        return res.status(500).json({ message: 'Error fetching event details', error: error.message });
    }
};

// Modified updateEvent to handle both single events and day events
export const updateEvent = async (req, res) => {
    try {
        const { id, dayEventId } = req.params; // id = event ID, dayEventId = optional day event ID
        const {
            title,
            occasion,
            start_date,
            end_date,
            is_multi_day,
            eventName, // For day events
            time,
            location,
            description,
            reminder,
            reminder_value,
            reminder_type,
            day_specific_data,
            isStyled,
            generatedImages,
            timezone,
            daySpecificImage
        } = req.body;

        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to update this event' });
        }

        // If dayEventId is provided, update specific day event
        if (dayEventId) {
            if (!event.isMultiDay) {
                return res.status(400).json({ message: 'This is not a multi-day event' });
            }

            const dayEvent = event.daySpecificData.id(dayEventId);
            
            if (!dayEvent) {
                return res.status(404).json({ message: 'Day event not found' });
            }

            // Update day event fields
            if (eventName) dayEvent.eventName = eventName;
            if (time) dayEvent.eventTime = time;
            if (location) dayEvent.location = location;
            if (description !== undefined) dayEvent.description = description;
            
            // Handle daySpecificImage as array
            if (daySpecificImage !== undefined) {
                if (Array.isArray(daySpecificImage)) {
                    dayEvent.daySpecificImage = daySpecificImage;
                } else if (daySpecificImage === null || daySpecificImage === '') {
                    dayEvent.daySpecificImage = [];
                } else {
                    dayEvent.daySpecificImage = [daySpecificImage];
                }
            }
            
            // Update reminder if provided
            if (reminder || reminder_value || reminder_type) {
                dayEvent.reminder = {
                    value: reminder_value || dayEvent.reminder.value,
                    type: reminder_type || dayEvent.reminder.type,
                    text: reminder || dayEvent.reminder.text,
                    isSent: false
                };
            }

            await event.save();

            return res.status(200).json({
                message: 'Day event updated successfully',
                event: dayEvent
            });
        }

        // Regular event update logic (your existing code)
        const updatedFields = {
            title: title || event.title,
            occasion: occasion || event.occasion,
            startDate: start_date ? new Date(start_date) : event.startDate,
            endDate: end_date ? new Date(end_date) : event.endDate,
            isMultiDay: is_multi_day !== undefined ? is_multi_day : event.isMultiDay,
            isStyled: isStyled !== undefined ? isStyled : event.isStyled,
            generatedImages: generatedImages || event.generatedImages,
            timezone: timezone || event.timezone
        };

        if (updatedFields.isMultiDay) {
            if (day_specific_data) {
                updatedFields.daySpecificData = Object.entries(day_specific_data).map(([dateStr, data]) => ({
                    date: new Date(dateStr),
                    eventName: data.event,
                    eventTime: data.time,
                    location: data.location,
                    description: data.description,
                    reminder: {
                        value: data.reminderValue || 1,
                        type: data.reminderType || 'Days before',
                        text: data.reminder || '1 day before',
                        isSent: false
                    },
                    // Handle daySpecificImage as array
                    daySpecificImage: Array.isArray(data.daySpecificImage) ? data.daySpecificImage : 
                                     (data.daySpecificImage ? [data.daySpecificImage] : [])
                }));
            }
            
            updatedFields.singleDayDetails = {
                eventTime: undefined,
                location: undefined,
                description: undefined,
                reminder: undefined
            };
        } else {
            updatedFields.singleDayDetails = {
                eventTime: time || event.singleDayDetails?.eventTime,
                location: location || event.singleDayDetails?.location,
                description: description || event.singleDayDetails?.description,
                reminder: {
                    value: reminder_value || event.singleDayDetails?.reminder?.value || 1,
                    type: reminder_type || event.singleDayDetails?.reminder?.type || 'Days before',
                    text: reminder || event.singleDayDetails?.reminder?.text || '1 day before',
                    isSent: false
                }
            };
            
            updatedFields.daySpecificData = [];
        }

        const updatedEvent = await Event.findByIdAndUpdate(id, updatedFields, { 
            new: true,
            runValidators: true 
        });

        res.status(200).json({ 
            message: 'Event updated successfully', 
            event: updatedEvent 
        });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ message: 'Error updating event', error: error.message });
    }
};

// Modified deleteEvent to handle both single events and day events
export const deleteEvent = async (req, res) => {
    const { id, dayEventId } = req.params;

    try {
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to delete this event' });
        }

        // If dayEventId is provided, delete specific day event
        if (dayEventId) {
            if (!event.isMultiDay) {
                return res.status(400).json({ message: 'This is not a multi-day event' });
            }

            const dayEvent = event.daySpecificData.id(dayEventId);
            
            if (!dayEvent) {
                return res.status(404).json({ message: 'Day event not found' });
            }

            // Check if this is the last day event
            if (event.daySpecificData.length === 1) {
                return res.status(400).json({ 
                    message: 'Cannot delete the last day event. Delete the entire multi-day event instead.' 
                });
            }

            // Remove the day event
            event.daySpecificData.pull(dayEventId);
            await event.save();

            return res.status(200).json({
                message: 'Day event deleted successfully',
                remainingDayEvents: event.daySpecificData.length
            });
        }

        // Delete entire event
        await Event.findByIdAndDelete(id);

        return res.status(200).json({ 
            message: 'Event deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        return res.status(500).json({ message: 'Error deleting event', error: error.message });
    }
};

export const getUpcomingEvents = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const currentDate = new Date();

        const upcomingEvents = await Event.find({
            userId: user._id,
            startDate: { $gte: currentDate }
        })
        .sort({ startDate: 1 });

        return res.status(200).json({
            message: 'Upcoming events fetched successfully',
            events: upcomingEvents
        });
    } catch (error) {
        console.error("Error fetching upcoming events:", error.message);
        return res.status(500).json({ message: 'Error fetching upcoming events', error: error.message });
    }
};

// Helper function to get event reminder data (useful for reminder services)
export const getEventReminders = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const currentDate = new Date();
        const events = await Event.find({
            userId: user._id,
            startDate: { $gte: currentDate }
        });

        const reminders = [];

        events.forEach(event => {
            if (event.isMultiDay) {
                // Handle multi-day event reminders
                event.daySpecificData.forEach(dayEvent => {
                    if (!dayEvent.reminder.isSent) {
                        reminders.push({
                            eventId: event._id,
                            dayEventId: dayEvent._id,
                            eventName: dayEvent.eventName,
                            date: dayEvent.date,
                            reminder: dayEvent.reminder,
                            isMultiDay: true
                        });
                    }
                });
            } else {
                // Handle single-day event reminders
                if (event.singleDayDetails?.reminder && !event.singleDayDetails.reminder.isSent) {
                    reminders.push({
                        eventId: event._id,
                        eventName: event.title,
                        date: event.startDate,
                        reminder: event.singleDayDetails.reminder,
                        isMultiDay: false
                    });
                }
            }
        });

        return res.status(200).json({
            message: 'Event reminders fetched successfully',
            reminders
        });
    } catch (error) {
        console.error("Error fetching event reminders:", error.message);
        return res.status(500).json({ message: 'Error fetching event reminders', error: error.message });
    }
};