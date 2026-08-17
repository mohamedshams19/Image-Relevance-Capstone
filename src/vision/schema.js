const { z } = require('zod');

const CATEGORIES = ['animal', 'landscape', 'object', 'person', 'other'];

const VisionResultSchema = z.object({
  subject: z.string().min(1),
  category: z.enum(CATEGORIES),
  attributes: z.array(z.string()).min(1),
  caption: z.string().min(1),
  confidence: z.number().min(0).max(1)
});

module.exports = { VisionResultSchema, CATEGORIES };