const { Event } = require('../models');

function generateSlug(title) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const suffix = Math.random().toString(36).slice(2, 5);
  return `${base}-${suffix}`;
}

async function uniqueSlug(title) {
  let slug = generateSlug(title);
  let attempt = 0;
  while (await Event.findOne({ where: { slug } })) {
    attempt++;
    slug = `${generateSlug(title)}-${attempt}`;
  }
  return slug;
}

module.exports = { generateSlug, uniqueSlug };
