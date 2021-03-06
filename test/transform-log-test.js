import TransformLog from '../src/transform/log';
import { TransformNotLoggedException, OutOfRangeException } from '../src/lib/exceptions';
import { FakeBucket } from './test-helper';

const { module, test } = QUnit;

module('TransformLog', function() {
  const transformAId = 'f8d2c75f-f758-4314-b5c5-ac7fb783ab26';
  const transformBId = '1d12dc84-0d03-4875-a4a6-0e389737d891';
  const transformCId = 'ea054670-8901-45c2-b908-4db2c5bb9c7d';
  const transformDId = '771b25ff-b971-42e0-aac3-c285aef75326';
  let log;

  test('can be instantiated with no data', function(assert) {
    log = new TransformLog();
    assert.ok(log, 'log instantiated');
    assert.equal(log.length, 0, 'log has expected size');
  });

  test('can be instantiated with an array', function(assert) {
    log = new TransformLog(['a', 'b']);
    assert.ok(log, 'log instantiated');
    assert.equal(log.length, 2, 'log has expected data');
  });

  module('when empty', function(assert) {
    assert.beforeEach(function() {
      log = new TransformLog();
    });

    test('#length', function(assert) {
      assert.equal(log.length, 0, 'is zero');
    });

    test('#append', function(assert) {
      assert.expect(2);

      log.on('append', (transformIds) => {
        assert.deepEqual(transformIds, [transformAId], 'append event emits transform');
      });

      return log.append(transformAId)
        .then(() => {
          assert.deepEqual(log.entries, [transformAId], 'adds transformId to log');
        });
    });

    test('#head', function(assert) {
      assert.equal(log.head, null, 'is null');
    });
  });

  module('containing several transformIds', function(assert) {
    assert.beforeEach(function() {
      log = new TransformLog();

      return log.append(
        transformAId,
        transformBId,
        transformCId
      );
    });

    test('#entries', function(assert) {
      assert.equal(log.entries.length, 3, 'contains the expected transforms');
    });

    test('#length', function(assert) {
      assert.equal(log.length, 3, 'reflects number of transforms that have been added');
    });

    test('#before', function(assert) {
      assert.deepEqual(log.before(transformCId), [transformAId, transformBId], 'includes transformIds preceding specified transformId');
    });

    test('#before - transformId that hasn\'t been logged', function(assert) {
      assert.throws(() => log.before(transformDId), TransformNotLoggedException);
    });

    test('#before - specifying a -1 relativePosition', function(assert) {
      assert.deepEqual(log.before(transformCId, -1), [transformAId], 'includes transformIds preceding specified transformId');
    });

    test('#before - specifying a relativePosition that is too low', function(assert) {
      assert.throws(() => log.before(transformCId, -3), OutOfRangeException);
    });

    test('#before - specifying a relativePosition that is too high', function(assert) {
      assert.throws(() => log.before(transformCId, 1), OutOfRangeException);
    });

    test('#after', function(assert) {
      assert.deepEqual(log.after(transformAId), [transformBId, transformCId], 'includes transformIds following specified transformId');
    });

    test('#after - transformId that hasn\'t been logged', function(assert) {
      assert.throws(() => log.after(transformDId), TransformNotLoggedException);
    });

    test('#after - specifying a +1 relativePosition', function(assert) {
      assert.deepEqual(log.after(transformAId, 1), [transformCId], 'includes transformIds following specified transformId');
    });

    test('#after - specifying a -1 relativePosition', function(assert) {
      assert.deepEqual(log.after(transformAId, -1), [transformAId, transformBId, transformCId], 'includes transformIds following specified transformId');
    });

    test('#after - head', function(assert) {
      log.after(log.head);
      assert.deepEqual(log.after(log.head), [], 'is empty');
    });

    test('#after - specifying a relativePosition that is too low', function(assert) {
      assert.throws(() => log.after(transformAId, -2), OutOfRangeException);
    });

    test('#after - specifying a relativePosition that is too high', function(assert) {
      assert.throws(() => log.after(transformCId, 1), OutOfRangeException);
    });

    test('#clear', function(assert) {
      assert.expect(2);

      log.on('clear', () => {
        assert.ok(true, 'clear event emitted');
      });

      return log.clear()
        .then(() => {
          assert.deepEqual(log.entries, [], 'clears all transforms');
        });
    });

    test('#truncate', function(assert) {
      assert.expect(3);

      log.on('truncate', (transformId, relativePosition) => {
        assert.strictEqual(transformId, transformBId, 'truncate event emits transform');
        assert.strictEqual(relativePosition, 0, 'truncate event emits relativePosition');
      });

      return log.truncate(transformBId)
        .then(() => {
          assert.deepEqual(log.entries, [transformBId, transformCId], 'removes transformIds before specified transformId');
        });
    });

    test('#truncate - to head', function(assert) {
      return log.truncate(log.head)
        .then(() => {
          assert.deepEqual(log.entries, [transformCId], 'only head entry remains in log');
        });
    });

    test('#truncate - just past head clears the log', function(assert) {
      return log.truncate(transformCId, +1)
        .then(() => {
          assert.deepEqual(log.entries, [], 'clears log');
        });
    });

    test('#truncate - to transformId that hasn\'t been logged', function(assert) {
      return log.truncate(transformDId)
        .catch(e => {
          assert.ok(e instanceof TransformNotLoggedException, 'TransformNotLoggedException caught');
        });
    });

    test('#truncate - specifying a relativePosition that is too low', function(assert) {
      return log.truncate(transformAId, -1)
        .catch(e => {
          assert.ok(e instanceof OutOfRangeException, 'OutOfRangeException caught');
        });
    });

    test('#truncate - specifying a relativePosition that is too high', function(assert) {
      return log.truncate(transformCId, +2)
        .catch(e => {
          assert.ok(e instanceof OutOfRangeException, 'OutOfRangeException caught');
        });
    });

    test('#rollback', function(assert) {
      assert.expect(3);

      log.on('rollback', (transformId, relativePosition) => {
        assert.strictEqual(transformId, transformAId, 'rollback event emits transform');
        assert.strictEqual(relativePosition, 0, 'rollback event emits relativePosition');
      });

      return log.rollback(transformAId)
        .then(() => {
          assert.deepEqual(log.entries, [transformAId], 'removes transformIds after specified transformId');
        });
    });

    test('#rollback - to head', function(assert) {
      return log.rollback(log.head)
        .then(() => {
          assert.deepEqual(log.head, transformCId, 'doesn\'t change log');
        });
    });

    test('#rollback - to transformId that hasn\'t been logged', function(assert) {
      return log.rollback(transformDId)
        .catch(e => {
          assert.ok(e instanceof TransformNotLoggedException, 'TransformNotLoggedException caught');
        });
    });

    test('#rollback - to just before first', function(assert) {
      return log.rollback(transformAId, -1)
        .then(() => {
          assert.deepEqual(log.entries, [], 'removes all entries');
        });
    });

    test('#rollback - specifying a relativePosition that is too low', function(assert) {
      return log.rollback(transformAId, -2)
        .catch(e => {
          assert.ok(e instanceof OutOfRangeException, 'OutOfRangeException caught');
        });
    });

    test('#rollback - specifying a relativePosition that is too high', function(assert) {
      return log.rollback(transformCId, +1)
        .catch(e => {
          assert.ok(e instanceof OutOfRangeException, 'OutOfRangeException caught');
        });
    });

    test('#head', function(assert) {
      assert.equal(log.head, transformCId, 'is last transformId');
    });

    test('#contains', function(assert) {
      assert.ok(log.contains(transformAId), 'identifies when log contains a transform');
    });
  });

  module('using a bucket', function(hooks) {
    let bucket;

    hooks.beforeEach(function() {
      bucket = new FakeBucket({ name: 'fake-bucket' });
    });

    hooks.afterEach(function() {
      bucket = null;
    });

    test('will be reified from data in the bucket', function(assert) {
      assert.expect(1);
      return bucket.setItem('log', [transformAId, transformBId])
        .then(() => {
          log = new TransformLog(null, { bucket, name: 'log' });
          return log.reified;
        })
        .then(() => {
          assert.equal(log.length, 2, 'log contains the expected transforms');
        });
    });

    test('#append - changes appended to the log are persisted to its bucket', function(assert) {
      assert.expect(2);
      log = new TransformLog(null, { bucket, name: 'log' });

      return log.append(transformAId, transformBId)
        .then(() => {
          assert.equal(log.length, 2, 'log contains the expected transforms');
          return bucket.getItem('log');
        })
        .then(logged => {
          assert.deepEqual(logged, [transformAId, transformBId], 'bucket contains the expected transforms');
        });
    });

    test('#truncate - truncations to the log are persisted to its bucket', function(assert) {
      assert.expect(2);
      log = new TransformLog(null, { bucket, name: 'log' });

      return log.append(transformAId, transformBId, transformCId)
        .then(() => log.truncate(log.head))
        .then(() => {
          assert.equal(log.length, 1, 'log contains the expected transforms');
          return bucket.getItem('log');
        })
        .then(logged => {
          assert.deepEqual(logged, [transformCId], 'bucket contains the expected transforms');
        });
    });

    test('#rollback - when the log is rolled back, it is persisted to its bucket', function(assert) {
      assert.expect(2);
      log = new TransformLog(null, { bucket, name: 'log' });

      return log.append(transformAId, transformBId, transformCId)
        .then(() => log.rollback(transformBId))
        .then(() => {
          assert.equal(log.length, 2, 'log contains the expected transforms');
          return bucket.getItem('log');
        })
        .then(logged => {
          assert.deepEqual(logged, [transformAId, transformBId], 'bucket contains the expected transforms');
        });
    });

    test('#clear - when the log is cleared, it is persisted to its bucket', function(assert) {
      assert.expect(2);
      log = new TransformLog(null, { bucket, name: 'log' });

      return log.append(transformAId, transformBId, transformCId)
        .then(() => log.clear())
        .then(() => {
          assert.equal(log.length, 0, 'log contains the expected transforms');
          return bucket.getItem('log');
        })
        .then(logged => {
          assert.deepEqual(logged, [], 'bucket contains the expected transforms');
        });
    });
  });
});
