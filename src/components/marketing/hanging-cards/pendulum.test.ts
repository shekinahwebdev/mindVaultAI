import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  HANGING_CARD_PHYSICS,
  hangingPose,
  stepPendulum,
  type PendulumConfig,
  type PendulumState,
} from "./pendulum";

function simulate(initial: PendulumState, config: PendulumConfig, seconds: number) {
  let state = initial;
  const dt = 1 / 60;
  const steps = Math.round(seconds / dt);
  let crossedRest = false;
  const startSide = Math.sign(initial.angle - config.restAngle);

  for (let index = 0; index < steps; index += 1) {
    state = stepPendulum(state, config, dt);
    const side = Math.sign(state.angle - config.restAngle);
    if (startSide !== 0 && side === -startSide) crossedRest = true;
    assert.ok(state.angle >= config.minAngle - 1e-6);
    assert.ok(state.angle <= config.maxAngle + 1e-6);
  }

  return { state, crossedRest };
}

describe("hangingPose", () => {
  it("keeps the card attachment on the thread end", () => {
    const length = 124;
    const pose = hangingPose(0.32, 0.04, length);

    assert.equal(pose.x, Math.sin(0.32) * length);
    assert.ok(pose.x > 0);
    assert.ok(pose.y > 0);
    assert.ok(Math.abs(pose.tilt - (0.32 * 0.4 + 0.04)) < 1e-9);
  });
});

describe("stepPendulum", () => {
  const config: PendulumConfig = {
    restAngle: 0,
    minAngle: -0.7,
    maxAngle: 0.7,
    stiffness: 12.4,
    damping: 1.82,
  };

  it("overshoots rest and then settles", () => {
    const { state, crossedRest } = simulate(
      { angle: 0.34, velocity: 0, twist: 0 },
      config,
      8,
    );

    assert.equal(crossedRest, true);
    assert.equal(state.angle, config.restAngle);
    assert.equal(state.velocity, 0);
    assert.equal(state.twist, 0);
  });

  it("settles each hanging card from its entrance offset", () => {
    for (const card of HANGING_CARD_PHYSICS) {
      const { state } = simulate(
        { angle: card.restAngle + card.entranceOffset, velocity: 0, twist: 0 },
        card,
        8,
      );

      assert.equal(state.angle, card.restAngle);
      assert.equal(state.velocity, 0);
      assert.equal(state.twist, 0);
    }
  });

  it("stays inside its swing limits after a hard release", () => {
    const { state } = simulate(
      { angle: 0.2, velocity: 8, twist: 0.2 },
      config,
      12,
    );

    assert.ok(state.angle <= config.maxAngle);
    assert.ok(state.angle >= config.minAngle);
    assert.ok(Math.abs(state.velocity) < 0.02);
  });
});
