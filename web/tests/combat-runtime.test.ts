import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { FixedStepClock } from '../src/combat/clock.ts';
import { BrowserSimulationLoop } from '../src/combat/browser-loop.ts';
import { angleDifference, segmentDistance2D, Vector3 } from '../src/combat/math.ts';
import { Projectile, type ProjectileSnapshot } from '../src/combat/projectile.ts';
import { Ship, type ShipDefinition } from '../src/combat/ship.ts';
import { SpaceObject } from '../src/combat/space-object.ts';

const shipDefinition: ShipDefinition = {
  shields: 30,
  shieldRecharge: 1,
  shieldRechargeDelay: 50,
  armor: 630,
  maxSpeed: 0.28,
  thrusterForce: 0.75,
  brakeForce: 0.6,
  turnSpeed: 2.2,
  size: 1,
  mass: 100,
  energy: 300,
  energyRecharge: 1,
};

it('keeps the browser loop stopped when combat pauses during an update', () => {
  let callback: FrameRequestCallback;
  let requests = 0;
  let updates = 0;
  const loop = new BrowserSimulationLoop(() => {
    updates += 1;
    loop.stop();
  }, () => {}, {
    request(next) { callback = next; return ++requests; },
    cancel() {},
  });
  loop.start();
  callback!(0);
  callback!(100);
  assert.equal(requests, 2);
  assert.equal(updates, 1);
});

function close(actual: number, expected: number): void {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
}

function projectileSnapshot(overrides: Partial<ProjectileSnapshot> = {}): ProjectileSnapshot {
  return {
    id: 10,
    ownerId: 1,
    definition: {
      lifetime: 4,
      shieldDamage: 10,
      armorDamage: 20,
      hitForce: 0.2,
      size: 1,
      collisionSize: 0.5,
      explosionSize: 0,
      seekLockAngle: 0,
      seekTurnSpeed: 0,
    },
    potentialTargetIds: [],
    seekTargetId: null,
    age: 0,
    expired: false,
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 1, z: 0 },
    acceleration: { x: 0, y: 0, z: 0 },
    angle: 0,
    ...overrides,
  };
}

describe('combat math and timing', () => {
  it('matches the Original Game vector conventions', () => {
    const vector = new Vector3(0, 1, 0).rotateZ(90);
    close(vector.x, -1);
    close(vector.y, 0);
    close(new Vector3(1, 0, 0).angle2D(), -90);
    assert.equal(angleDifference(359, 1), 2);
    assert.equal(angleDifference(0, 180), 180);
    assert.equal(angleDifference(180, 0), -180);
    close(segmentDistance2D({ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 0 }, { x: 5, y: 2, z: 0 }), 2);
  });

  it('runs exactly 40 simulation updates per second independent of render cadence', () => {
    const run = (framesPerSecond: number) => {
      const clock = new FixedStepClock();
      let ticks = 0;
      for (let frame = 0; frame < framesPerSecond * 10; frame += 1) {
        clock.advance(1000 / framesPerSecond, () => { ticks += 1; });
      }
      return ticks;
    };

    assert.equal(run(60), 400);
    assert.equal(run(120), 400);
    let catchUpTicks = 0;
    new FixedStepClock().advance(60_000, () => { catchUpTicks += 1; });
    assert.equal(catchUpTicks, 10);
  });
});

describe('space objects and ships', () => {
  it('keeps objects inside the radius-80 stage and reflects outward velocity', () => {
    const object = new SpaceObject({
      position: { x: 79.99, y: 0, z: 0 },
      velocity: { x: 0.28, y: 0, z: 0 },
      acceleration: { x: 0, y: 0, z: 0 },
      angle: 0,
    });
    object.update();
    assert.ok(object.position.length() < 80);
    assert.ok(object.velocity.x < 0);
  });

  it('preserves per-tick thrust, braking, turning, recharge, and damage overflow', () => {
    const ship = Ship.create(1, 'Cyber Frigate', shipDefinition, 11);
    ship.controls.thrusting = true;
    ship.desiredAngle = 90;
    ship.update();
    close(ship.velocity.length(), 0.75 / 111);
    close(ship.angle, 2.2);
    const opposite = Ship.create(2, 'Cyber Frigate', shipDefinition);
    opposite.desiredAngle = 180;
    opposite.update();
    close(opposite.angle, 2.2);

    ship.damage(90, 130);
    close(ship.currentArmor, 630 - 130 * 2 / 3);
    assert.equal(ship.currentShields, 0);
    ship.controls.thrusting = false;
    ship.controls.braking = true;
    for (let tick = 0; tick < 51; tick += 1) ship.update();
    assert.equal(ship.currentShields, 1);
  });

  it('round-trips the live ship state through JSON-safe snapshots', () => {
    const ship = Ship.create(7, 'Cyber Frigate', shipDefinition, 11);
    ship.position.set({ x: 2, y: 3, z: 4 });
    ship.controls.reversing = true;
    ship.update();
    const restored = new Ship(JSON.parse(JSON.stringify(ship.toSnapshot())) as ReturnType<Ship['toSnapshot']>);
    assert.deepEqual(restored.toSnapshot(), ship.toSnapshot());
  });
});

describe('projectiles and deterministic update boundaries', () => {
  it('expires before moving on its lifetime tick and round-trips state', () => {
    const projectile = new Projectile(projectileSnapshot({ age: 2 }));
    projectile.updateWithTargets(new Map());
    assert.equal(projectile.position.y, 1);
    projectile.updateWithTargets(new Map());
    assert.equal(projectile.expired, true);
    assert.equal(projectile.position.y, 1);
    assert.deepEqual(
      new Projectile(JSON.parse(JSON.stringify(projectile.toSnapshot())) as ProjectileSnapshot).toSnapshot(),
      projectile.toSnapshot(),
    );
  });

});

it('converts browser acceleration into the native landscape steering direction', async () => {
  const { nativeAccelerationY } = await import('../src/application/accelerometer.ts');
  close(nativeAccelerationY(0, 9.80665, 90, true), 1);
  close(nativeAccelerationY(0, -9.80665, 90, false), 1);
  close(nativeAccelerationY(0, -9.80665, 270, true), 1);
  close(nativeAccelerationY(0, 9.80665, 270, false), 1);
});
