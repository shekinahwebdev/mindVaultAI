/**
 * Pendulum pose and integration for the landing-page hanging cards.
 *
 * Angle is measured from straight down at the shared anchor. Positive angles
 * swing to the right. CSS rotation is clockwise-positive, so rendered rotation
 * is the negation of this angle.
 */

export const TILT_FOLLOW = 0.4;

export type PendulumState = {
  angle: number;
  velocity: number;
  twist: number;
};

export type PendulumConfig = {
  restAngle: number;
  minAngle: number;
  maxAngle: number;
  stiffness: number;
  damping: number;
};

export type HangingCardPhysics = PendulumConfig & {
  id: string;
  entranceOffset: number;
  /** Subtle idle oscillation amplitude (radians). */
  idleAmplitude: number;
  idlePhase: number;
};

/** Rest angles form a compact fan from the shared anchor. */
export const HANGING_CARD_PHYSICS: readonly HangingCardPhysics[] = [
  {
    id: "save",
    restAngle: -0.24,
    minAngle: -0.48,
    maxAngle: -0.06,
    stiffness: 10.8,
    damping: 2.05,
    entranceOffset: -0.12,
    idleAmplitude: 0.014,
    idlePhase: 0,
  },
  {
    id: "organise",
    restAngle: 0.02,
    minAngle: -0.2,
    maxAngle: 0.2,
    stiffness: 11.2,
    damping: 2.1,
    entranceOffset: 0.08,
    idleAmplitude: 0.004,
    idlePhase: 1.1,
  },
  {
    id: "find",
    restAngle: 0.24,
    minAngle: 0.06,
    maxAngle: 0.48,
    stiffness: 10.8,
    damping: 2.05,
    entranceOffset: 0.12,
    idleAmplitude: 0.012,
    idlePhase: 2.4,
  },
];

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function hangingPose(angle: number, twist: number, length: number) {
  return {
    x: Math.sin(angle) * length,
    y: (1 - Math.cos(angle)) * length,
    tilt: angle * TILT_FOLLOW + twist,
  };
}

export function stepPendulum(
  state: PendulumState,
  config: PendulumConfig,
  dt: number,
): PendulumState {
  const safeDt = clamp(dt, 0, 0.034);
  let { angle, velocity, twist } = state;
  const displacement = angle - config.restAngle;
  const accel = -config.stiffness * Math.sin(displacement) - config.damping * velocity;

  velocity = clamp(velocity + accel * safeDt, -2.8, 2.8);
  angle += velocity * safeDt;

  if (angle < config.minAngle) {
    angle = config.minAngle;
    velocity *= -0.16;
  } else if (angle > config.maxAngle) {
    angle = config.maxAngle;
    velocity *= -0.16;
  }

  const twistTarget = clamp(velocity * 0.038, -0.09, 0.09);
  twist += (twistTarget - twist) * Math.min(1, safeDt * 9);

  if (
    Math.abs(velocity) < 0.01 &&
    Math.abs(angle - config.restAngle) < 0.0025 &&
    Math.abs(twist) < 0.005
  ) {
    return { angle: config.restAngle, velocity: 0, twist: 0 };
  }

  return { angle, velocity, twist };
}

export function limitsForSpan(config: PendulumConfig, span: number): PendulumConfig {
  const amount = clamp(span, 0, 1);
  return {
    ...config,
    minAngle: config.restAngle + (config.minAngle - config.restAngle) * amount,
    maxAngle: config.restAngle + (config.maxAngle - config.restAngle) * amount,
  };
}
