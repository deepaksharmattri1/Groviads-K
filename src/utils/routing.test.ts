import test from 'node:test';
import assert from 'node:assert/strict';
import { filterItemsByQuery, getPageMeta, parseAppRoute } from './routing';

test('parseAppRoute resolves valid routes, trailing slashes, and enquiry fallback', () => {
  assert.equal(parseAppRoute('/'), '/');
  assert.equal(parseAppRoute('/services/'), '/services');
  assert.equal(parseAppRoute('/portfolio'), '/portfolio');
  assert.equal(parseAppRoute('/ai-hub'), '/ai-hub');
  assert.equal(parseAppRoute('/contact'), '/contact');
  assert.equal(parseAppRoute('/enquiry'), '/contact');
  assert.equal(parseAppRoute('/dashboard'), '/');
  assert.equal(parseAppRoute('/unknown-path'), '/');
});

test('getPageMeta returns distinct titles and section names for each route', () => {
  assert.equal(getPageMeta('/services').section, 'services');
  assert.equal(getPageMeta('/portfolio').section, 'portfolio');
  assert.ok(getPageMeta('/contact').title.includes('Enquiry'));
});

test('filterItemsByQuery matches across title, summary, and deliverables', () => {
  const sample = [
    {
      title: 'Digital Marketing & Search Optimization',
      summary: 'Organic visibility across search and AI answers',
      deliverables: ['GEO & AEO', 'Local SEO'],
    },
    {
      title: 'Software Development & Engineering',
      summary: 'Custom SaaS and CRM platforms',
      deliverables: ['REST APIs', 'Cloud Deployment'],
    },
  ];
  assert.equal(filterItemsByQuery(sample, 'geo').length, 1);
  assert.equal(filterItemsByQuery(sample, 'saas').length, 1);
  assert.equal(filterItemsByQuery(sample, '').length, 2);
});
