function createSlot(id, x, y, w, h, options = {}) {
  return {
    id,
    x,
    y,
    w,
    h,
    detect: {
      x: options.detect?.x ?? 0.22,
      y: options.detect?.y ?? 0.18,
      w: options.detect?.w ?? 0.56,
      h: options.detect?.h ?? 0.62,
    },
    mark: {
      x: options.mark?.x ?? 0.18,
      y: options.mark?.y ?? 0.14,
      w: options.mark?.w ?? 0.58,
      h: options.mark?.h ?? 0.66,
    },
    thresholds: {
      coreBrightness: options.thresholds?.coreBrightness ?? 118,
      coreBrightRatio: options.thresholds?.coreBrightRatio ?? 0.28,
      coreDarkRatio: options.thresholds?.coreDarkRatio ?? 0.24,
      averageBrightness: options.thresholds?.averageBrightness ?? 94,
    },
  };
}

const SLOT_MAP = [
  createSlot("L1", 0.07, 0.33, 0.11, 0.055),
  createSlot("L2", 0.08, 0.41, 0.115, 0.058),
  createSlot("L3", 0.09, 0.49, 0.12, 0.06),
  createSlot("L4", 0.105, 0.60, 0.13, 0.065),
  createSlot("L5", 0.115, 0.73, 0.145, 0.07),

  createSlot("CL1", 0.22, 0.22, 0.155, 0.053),
  createSlot("CL2", 0.24, 0.29, 0.155, 0.054),
  createSlot("CL3", 0.255, 0.37, 0.16, 0.058),
  createSlot("CL4", 0.27, 0.47, 0.16, 0.06),
  createSlot("CL5", 0.275, 0.57, 0.165, 0.064),
  createSlot("CL6", 0.285, 0.69, 0.17, 0.068),
  createSlot("CL7", 0.29, 0.82, 0.175, 0.072),

  createSlot("R1", 0.60, 0.22, 0.15, 0.053),
  createSlot("R2", 0.595, 0.30, 0.155, 0.055),
  createSlot("R3", 0.61, 0.39, 0.155, 0.058),
  createSlot("R4", 0.625, 0.49, 0.16, 0.06),
  createSlot("R5", 0.64, 0.60, 0.165, 0.064),
  createSlot("R6", 0.655, 0.72, 0.17, 0.068),
  createSlot("R7", 0.68, 0.84, 0.18, 0.073),
];

module.exports = {
  SLOT_MAP,
};
