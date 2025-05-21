import Event from '../models/Event.js';

export const addEvent = async (req, res) => {
    const { name, date, dayTime, occasion, description } = req.body;

    try {
        const newEvent = await Event.create({
            name,
            date,
            dayTime,
            occasion,
            description,
        });

        res.status(201).json({ message: 'Event created successfully', event: newEvent });
    } catch (error) {
        res.status(500).json({ message: 'Error creating event', error: error.message });
    }
};

export const updateEvent = async (req, res) => {
    const { id } = req.params;
    const { name, date, dayTime, occasion, description } = req.body;

    try {
        const updatedEvent = await Event.findByIdAndUpdate(
            id,
            { name, date, dayTime, occasion, description },
            { new: true }
        );

        if (!updatedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json({ message: 'Event updated successfully', event: updatedEvent });
    } catch (error) {
        res.status(500).json({ message: 'Error updating event', error: error.message });
    }
};

export const deleteEvent = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedEvent = await Event.findByIdAndDelete(id);

        if (!deletedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting event', error: error.message });
    }
};

// getAllEvents is due because of User model

export const getEventDetails = async (req, res) => {
    try {
        const {id} = req.params;
        const eventDetails = await Event.findById(id);;
        if(!eventDetails) {
            return res.status(404).json({ message: 'Event not found' });
        };
        res.status(200).json({ message: 'Event details fetched successfully', event: eventDetails });
    } catch (error) {
        console.log("error : ", error.message);
        res.status(500).json({ message: 'Error fetching event details', error: error.message });
    }
}