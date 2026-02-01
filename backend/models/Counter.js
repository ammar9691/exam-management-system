/**
 * Counter Model
 * Used for generating atomic, sequential IDs (e.g., question serial numbers)
 * Uses findOneAndUpdate with $inc for concurrency-safe increments
 */

import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  sequenceValue: {
    type: Number,
    default: 0
  },
  prefix: {
    type: String,
    default: ''
  },
  padding: {
    type: Number,
    default: 6  // Q000001 = 6 digit padding
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

/**
 * Get next sequence value atomically
 * @param {string} counterId - The counter identifier (e.g., 'question_serial')
 * @param {number} incrementBy - How much to increment (default: 1, use higher for bulk)
 * @returns {Promise<number>} The next sequence value
 */
counterSchema.statics.getNextSequence = async function(counterId, incrementBy = 1) {
  const counter = await this.findOneAndUpdate(
    { _id: counterId },
    {
      $inc: { sequenceValue: incrementBy },
      $set: { lastUpdated: new Date() }
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );

  // Return the starting value for this batch
  // If incrementBy = 1, this returns the new value
  // If incrementBy > 1 (bulk), this returns the last value of the batch
  return counter.sequenceValue;
};

/**
 * Get next sequence range for bulk operations
 * @param {string} counterId - The counter identifier
 * @param {number} count - Number of sequential values needed
 * @returns {Promise<{start: number, end: number}>} Range of sequence values
 */
counterSchema.statics.getSequenceRange = async function(counterId, count) {
  const endValue = await this.getNextSequence(counterId, count);
  return {
    start: endValue - count + 1,
    end: endValue
  };
};

/**
 * Get current sequence value without incrementing
 * @param {string} counterId - The counter identifier
 * @returns {Promise<number>} Current sequence value
 */
counterSchema.statics.getCurrentValue = async function(counterId) {
  const counter = await this.findById(counterId);
  return counter ? counter.sequenceValue : 0;
};

/**
 * Initialize a counter with specific settings
 * @param {string} counterId - The counter identifier
 * @param {Object} options - Counter options (prefix, padding, startValue)
 */
counterSchema.statics.initializeCounter = async function(counterId, options = {}) {
  const { prefix = '', padding = 6, startValue = 0 } = options;

  await this.findOneAndUpdate(
    { _id: counterId },
    {
      $setOnInsert: {
        sequenceValue: startValue,
        prefix,
        padding,
        lastUpdated: new Date()
      }
    },
    { upsert: true }
  );
};

/**
 * Format sequence number with prefix and padding
 * @param {string} counterId - The counter identifier
 * @param {number} sequenceValue - The sequence value to format
 * @returns {Promise<string>} Formatted serial number (e.g., 'Q000001')
 */
counterSchema.statics.formatSerialNumber = async function(counterId, sequenceValue) {
  const counter = await this.findById(counterId);
  const prefix = counter?.prefix || 'Q';
  const padding = counter?.padding || 6;

  return `${prefix}${String(sequenceValue).padStart(padding, '0')}`;
};

/**
 * Generate formatted serial number(s) atomically
 * @param {string} counterId - The counter identifier
 * @param {number} count - Number of serial numbers needed (default: 1)
 * @returns {Promise<string|string[]>} Single serial or array of serials
 */
counterSchema.statics.generateSerialNumbers = async function(counterId, count = 1) {
  const counter = await this.findById(counterId);
  const prefix = counter?.prefix || 'Q';
  const padding = counter?.padding || 6;

  if (count === 1) {
    const nextValue = await this.getNextSequence(counterId, 1);
    return `${prefix}${String(nextValue).padStart(padding, '0')}`;
  }

  const range = await this.getSequenceRange(counterId, count);
  const serials = [];

  for (let i = range.start; i <= range.end; i++) {
    serials.push(`${prefix}${String(i).padStart(padding, '0')}`);
  }

  return serials;
};

// Counter IDs as constants
export const COUNTER_IDS = {
  QUESTION_SERIAL: 'question_serial'
};

const Counter = mongoose.model('Counter', counterSchema);

export default Counter;
