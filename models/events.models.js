import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    occasion: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    
    // Multi-day event support
    isMultiDay: { type: Boolean, default: false },
    
    // Single-day event fields (required only for multi-day events)
    eventName: { 
        type: String, 
        required: function() { return this.isMultiDay; } 
    },
    eventTime: { 
        type: String, 
        required: function() { return !this.isMultiDay; } 
    },
    location: { 
        type: String, 
        required: function() { return !this.isMultiDay; } 
    },
    description: { type: String },
    
    // Single event reminder (for non-multi-day events)
    reminder: {
        value: { type: Number, default: 1 },
        type: { 
            type: String, 
            enum: ['Days before', 'Hours before', 'Weeks before', 'No reminders, I ❤️ FOMO'], 
            default: 'Days before' 
        },
        text: { type: String, default: '1 day before' },
        isSent: { type: Boolean, default: false }
    },
    
    // Multi-day event data (array of day-specific plans)
    daySpecificData: [{
        date: { type: Date, required: true },
        eventName: { type: String, required: true },
        eventTime: { type: String, required: true },
        location: { type: String, required: true },
        description: { type: String },
        reminder: {
            value: { type: Number, default: 1 },
            type: { 
                type: String, 
                enum: ['Days before', 'Hours before', 'Weeks before', 'No reminders, I ❤️ FOMO'], 
                default: 'Days before' 
            },
            text: { type: String, default: '1 day before' },
            isSent: { type: Boolean, default: false }
        }
    }],
    
    // Styling and media
    isStyled: { type: Boolean, default: false },
    generatedImages: [{ type: String }],
    // timezone: { type: String, default: 'UTC' }
     // TTL field for automatic deletion
    expiresAt: { 
        type: Date, 
        default: function() {
            // Delete 1 days after end date (adjust as needed)
            return new Date(this.endDate.getTime() + (1 * 24 * 60 * 60 * 1000));
        }
    }
}, {timestamps: true});


// Add compound index for user and date queries
eventSchema.index({ userId: 1, startDate: 1 });
eventSchema.index({ userId: 1, endDate: 1 });

export const Event = mongoose.model('Event', eventSchema);