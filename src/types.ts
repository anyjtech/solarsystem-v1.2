export interface Planet {
  id: string;
  name: string;
  englishName: string;
  color: string;
  secondaryColor: string;
  accentColor: string;
  baseDistance: number; // For visualization scaling
  realDistance: string; // Factual stats
  baseRadius: number; // For rendering size
  realSize: string; // Fact stats (diameter)
  orbitSpeed: number; // Time scaling increment
  realOrbitPeriod: string; // Fact stats (365 days / Earth year)
  realRotationPeriod: string; // Fact stats (e.g. 24 hours)
  inclination: number; // Orbital tilt in radians (for 3D effect)
  temperature: string; // Fact stats
  moonsCount: number;
  moonsList: string[];
  description: string;
  atmosphere: string[];
  funFact: string;
  geology: string;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface RotatedPoint extends Point3D {
  rotatedX: number;
  rotatedY: number;
  rotatedZ: number;
}

export interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  brightness: number;
}
