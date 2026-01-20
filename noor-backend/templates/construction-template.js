/**
 * Standard Construction Project Template
 * Based on the User's Request for 14 standardized phases per floor
 * 
 * Default Floors:
 * 1. Ground Floor
 * 2. First Floor
 * 
 * Each floor gets the same 14 phases.
 */

const STANDARD_PHASES = [
    "Site Preparation",
    "Foundation Work",
    "Column Construction",
    "Beam Construction",
    "Slab Work",
    "Brick Work",
    "Electrical Conduiting",
    "Plumbing Work",
    "Plastering",
    "Flooring",
    "Door & Window Fixing",
    "Painting",
    "Finishing Works",
    "Final Inspection"
];

const BASEMENT_PHASES = [
    "Site Preparation",
    "Excavation",
    "Footing Construction",
    "Foundation Work",
    "Column Construction",
    "Beam Construction",
    "Slab Work",
    "Brick Work",
    "Electrical Conduiting",
    "Plumbing Work",
    "Plastering",
    "Flooring",
    "Waterproofing",
    "Final Inspection"
];

const generateFloorPhases = (floorName, floorNumber, startSerial, phasesList = STANDARD_PHASES) => {
    return phasesList.map((name, index) => ({
        serialNumber: startSerial + index, // Unique serial/order number
        floorNumber: floorNumber,
        floorName: floorName,
        stageName: name,
        tasks: [] // User didn't specify default tasks, keeping empty or minimal
    }));
};

const CONSTRUCTION_TEMPLATE = [
    ...generateFloorPhases("Basement", -1, 1, BASEMENT_PHASES),
    ...generateFloorPhases("Ground Floor", 0, 15, STANDARD_PHASES),
    ...generateFloorPhases("First Floor", 1, 29, STANDARD_PHASES)
];

module.exports = CONSTRUCTION_TEMPLATE;

