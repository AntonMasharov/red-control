import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const schema = JSON.parse(
  readFileSync(new URL('../src/content/catalog.schema.json', import.meta.url)),
);
/** Implements precisely the JSON Schema keywords used by the checked-in schema. */
export function validateShape(value, rule = schema, path = '$') {
  if (rule.if) {
    let matches = true;
    try {
      validateShape(value, rule.if, path);
    } catch {
      matches = false;
    }
    if (matches && rule.then) validateShape(value, rule.then, path);
  }
  if (rule.$ref) return validateShape(value, schema.$defs[rule.$ref.split('/').at(-1)], path);
  if ('const' in rule) assert.deepEqual(value, rule.const, path);
  if (rule.enum) assert.ok(rule.enum.includes(value), path + ': invalid enum');
  if (rule.type) {
    const actual = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
    assert.ok(
      [rule.type]
        .flat()
        .some((type) => type === actual || (type === 'integer' && Number.isInteger(value))),
      path + ': expected ' + rule.type,
    );
  }
  if (typeof value === 'string') {
    if (rule.minLength) assert.ok(value.trim().length >= rule.minLength, path + ': empty');
    if (rule.pattern) assert.match(value, new RegExp(rule.pattern), path);
  }
  if (typeof value === 'number' && rule.minimum !== undefined)
    assert.ok(value >= rule.minimum, path);
  if (Array.isArray(value)) {
    if (rule.minItems) assert.ok(value.length >= rule.minItems, path);
    if (rule.maxItems) assert.ok(value.length <= rule.maxItems, path);
    if (rule.uniqueItems)
      assert.equal(new Set(value.map((v) => JSON.stringify(v))).size, value.length, path);
    value.forEach((v, i) => validateShape(v, rule.items, path + '[' + i + ']'));
  } else if (value && typeof value === 'object') {
    for (const key of rule.required || [])
      assert.ok(Object.hasOwn(value, key), path + ': missing ' + key);
    for (const [key, v] of Object.entries(value)) {
      const child = rule.properties?.[key] || rule.additionalProperties;
      assert.notEqual(child, false, path + ': unknown ' + key);
      if (child && child !== true) validateShape(v, child, path + '.' + key);
    }
  }
}
export function validateCatalog(c) {
  validateShape(c);
  if (c.problemSolving) {
    const check = (ids) =>
      ids.forEach((id) =>
        assert.ok(c.problemSolving.stages[id], 'Unknown problem-solving stage: ' + id),
      );
    check(c.problemSolving.default);
    Object.values(c.tasks).forEach((task) => {
      if (task.problemSolving) check(task.problemSolving);
    });
    for (const campaign of Object.values(c.campaigns)) {
      const route = c.roadmaps[campaign.election.roadmapConfigId];
      const tasks = [...route.steps, ...route.anytime].flatMap((step) =>
        c.blocks[step.blockId].taskIds.map((id) => c.tasks[id]),
      );
      const complaints = new Set(
        (campaign.complaints || []).flatMap((t) => t.checkbox_items.map((i) => i.id)),
      );
      tasks.forEach((task) => {
        if (task.complaintId)
          assert.ok(complaints.has(task.complaintId), 'Unknown complaint for task: ' + task.id);
      });
    }
  }
  const ref = (table, id) => assert.ok(Object.hasOwn(table, id), 'Unknown reference: ' + id);
  const unique = (rows) =>
    assert.equal(new Set(rows.map((r) => r.id)).size, rows.length, 'Duplicate ID');
  for (const name of [
    'sources',
    'laws',
    'topics',
    'tasks',
    'blocks',
    'roadmaps',
    'documents',
    'headquarters',
    'contacts',
  ])
    for (const [id, row] of Object.entries(c[name]))
      assert.equal(row.id, id, 'Table key differs from ID');
  for (const row of [
    ...Object.values(c.laws),
    ...Object.values(c.topics),
    ...Object.values(c.tasks),
  ]) {
    row.sourceIds.forEach((id) => ref(c.sources, id));
    (row.lawIds || []).forEach((id) => ref(c.laws, id));
    (row.references || []).forEach((r) => ref(c.sources, r.sourceId));
    (row.media || []).forEach((m) => ref(c.sources, m.sourceId));
  }
  for (const l of Object.values(c.laws))
    l.sourceIds.forEach((id) => assert.equal(c.sources[id].purpose, 'raw-law'));
  Object.values(c.documents).forEach((d) => ref(c.sources, d.sourceId));
  Object.values(c.headquarters).forEach((h) => h.contactIds.forEach((id) => ref(c.contacts, id)));
  Object.values(c.blocks).forEach((b) => b.taskIds.forEach((id) => ref(c.tasks, id)));
  Object.values(c.roadmaps).forEach((r) => {
    unique([...r.steps, ...r.anytime]);
    [...r.steps, ...r.anytime].forEach((s) => ref(c.blocks, s.blockId));
  });
  const precinctIds = new Set();
  for (const [id, p] of Object.entries(c.campaigns)) {
    const e = p.election;
    assert.equal(id, e.id);
    assert.equal(e.infoId, p.info.id);
    ref(c.roadmaps, e.roadmapConfigId);
    assert.deepEqual(e.dates, [...e.dates].sort());
    e.dates.forEach((d) =>
      assert.equal(new Date(d + 'T12:00:00Z').toISOString().slice(0, 10), d, 'Invalid date'),
    );
    for (const [field, table] of [
      ['topicIds', 'topics'],
      ['lawIds', 'laws'],
      ['sourceIds', 'sources'],
      ['documentIds', 'documents'],
    ])
      e[field].forEach((id) => ref(c[table], id));
    const inScope = (row) => {
      (row.lawIds || []).forEach((id) =>
        assert.ok(e.lawIds.includes(id), 'Law outside campaign: ' + id),
      );
      [
        ...(row.sourceIds || []),
        ...(row.references || []).map((r) => r.sourceId),
        ...(row.media || []).map((m) => m.sourceId),
      ].forEach((id) => assert.ok(e.sourceIds.includes(id), 'Source outside campaign: ' + id));
    };
    e.topicIds.forEach((id) => inScope(c.topics[id]));
    e.lawIds.forEach((id) => inScope(c.laws[id]));
    e.documentIds.forEach((id) => assert.ok(e.sourceIds.includes(c.documents[id].sourceId)));
    const roadmap = c.roadmaps[e.roadmapConfigId];
    [...roadmap.steps, ...roadmap.anytime].forEach((s) =>
      c.blocks[s.blockId].taskIds.forEach((id) => inScope(c.tasks[id])),
    );
    for (const [key, n] of Object.entries(p.commissions)) {
      assert.equal(key, n.id);
      if (n.parentId === null) assert.equal(n.kind, 'IKSRF', 'Only IKSRF can be a root');
      else {
        ref(p.commissions, n.parentId);
        const parent = p.commissions[n.parentId];
        assert.ok(
          { IKSRF: ['IKSRF'], OIK: ['IKSRF'], TIK: ['IKSRF', 'OIK'], UIK: ['TIK'] }[
            n.kind
          ].includes(parent.kind),
          'Invalid commission hierarchy',
        );
      }
      const seen = new Set([key]);
      let node = n;
      while (node.parentId !== null) {
        assert.ok(!seen.has(node.parentId), 'Commission cycle');
        seen.add(node.parentId);
        node = p.commissions[node.parentId];
        assert.ok(node);
      }
      if (n.kind === 'UIK') {
        assert.ok(
          n.number?.trim() && n.address?.trim() && n.region?.trim() && Array.isArray(n.members),
          'Incomplete UIK',
        );
        assert.equal(n.electionId, e.id);
        ref(c.headquarters, n.hqId);
        unique(n.members);
        assert.ok(!precinctIds.has(n.id), 'UIK assignment IDs must be globally unique');
        precinctIds.add(n.id);
      }
    }
  }
  return c;
}

export function validateCampaignFile(value) {
  validateShape(value, schema.$defs.campaignFile);
  return value;
}
