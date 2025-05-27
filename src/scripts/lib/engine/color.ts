import { vec3 } from "gl-matrix";

export type HexColor = `#${string}`;
export type RGB = vec3;

export const hexToRgb = (hex: HexColor): RGB => vec3.fromValues(
    (Number.parseInt(hex.slice(1, 3), 16) / 255),
    (Number.parseInt(hex.slice(3, 5), 16) / 255),
    (Number.parseInt(hex.slice(5, 7), 16) / 255),
)
