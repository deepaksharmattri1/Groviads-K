import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const blueprintPath = path.resolve(process.cwd(), 'firebase-blueprint.json');
const rulesText = fs.readFileSync(rulesPath, 'utf8');
const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8')) as {
  entities: Record<string, { properties: Record<string, { maxLength?: number }> }>;
  firestore: Record<string, unknown>;
};

test('firestore.rules enforces Eight Pillars security invariants', () => {
  assert.match(rulesText, /rules_version = '2';/);
  assert.match(rulesText, /match \/\{document=\*\*\} \{\s*allow read, write: if false;/);
  assert.match(rulesText, /request\.auth\.token\.email_verified == true/);
  assert.match(rulesText, /isValidId\(/);
  assert.match(rulesText, /incoming\(\)\.createdAt == request\.time/);
  assert.match(rulesText, /incoming\(\)\.updatedAt == request\.time/);
  assert.match(rulesText, /affectedKeys\(\)\.hasOnly\(/);

  // Blueprint entities and collection paths match firestore.rules
  for (const collectionPath of Object.keys(blueprint.firestore)) {
    const collectionName = collectionPath.split('/')[1];
    assert.ok(
      rulesText.includes(`match /${collectionName}/`),
      `Missing match block for ${collectionName}`
    );
  }

  // Blueprint maxLength bounds match rules bounds
  assert.equal(blueprint.entities.ClientLead.properties.challenges.maxLength, 2000);
  assert.match(rulesText, /isValidString\(data\.challenges, 10, 2000\)/);
  assert.equal(blueprint.entities.AdvisoryBrief.properties.responseText.maxLength, 12000);
  assert.match(rulesText, /isValidString\(data\.responseText, 1, 12000\)/);
});
