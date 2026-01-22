/**
 * Standard Construction Project Template
 * Fixed 14-stage lifecycle with detailed sub-tasks.
 */

const CONSTRUCTION_TEMPLATE = [
    {
        serialNumber: 1,
        floorNumber: 0,
        floorName: "",
        stageName: "Initial Planning & Site Preparation",
        tasks: [
            "Site plan",
            "Architectural drawings",
            "Elevation",
            "Site pooja"
        ]
    },
    {
        serialNumber: 2,
        floorNumber: 0,
        floorName: "",
        stageName: "Basement / Foundation Construction",
        tasks: [
            "Site clearance",
            "Marking",
            "Excavation",
            "PCC",
            "Bar bending",
            "Pillar marking and placing",
            "Footing concrete",
            "Earth pit column concrete below GL",
            "Earth pit soil filling and soil tightening",
            "Plinth level marking",
            "Plinth beam bar bending and shuttering",
            "Concreting and de-shuttering",
            "Basement level brick work – inner plastering",
            "Gravel filling",
            "Soil consolidation",
            "DPC concrete and PCC",
            "Water tank and septic tank"
        ]
    },
    {
        serialNumber: 3,
        floorNumber: 0,
        floorName: "",
        stageName: "Lintel Level Construction",
        tasks: [
            "Lintel level marking",
            "Column shoe marking",
            "Rod lapping (if needed)",
            "Column box fixing and concreting",
            "Sill level brick work (3’)",
            "Sill concrete",
            "Lintel level brick work",
            "Lintel level shuttering",
            "Bar bending and concreting"
        ]
    },
    {
        serialNumber: 4,
        floorNumber: 0,
        floorName: "",
        stageName: "Roof Level Construction",
        tasks: [
            "Roof level marking",
            "Rod lapping (if needed)",
            "Brick work",
            "Roof centering",
            "Bar bending",
            "Electrical pipeline fixing",
            "Concreting",
            "Concrete de-shuttering",
            "Electrical pipeline gady work"
        ]
    },
    {
        serialNumber: 5,
        floorNumber: 0,
        floorName: "",
        stageName: "Wall & Finishing Works",
        tasks: [
            "Parapet wall brick work and sill concrete",
            "Doors and windows frame fixing",
            "Inner plastering",
            "Kitchen tabletop concreting",
            "Outer plastering",
            "Rooftop surki concrete",
            "Elevation work"
        ]
    },
    {
        serialNumber: 6,
        floorNumber: 0,
        floorName: "",
        stageName: "Compound Wall Construction",
        tasks: [
            "Compound wall basement",
            "Brick work",
            "Plastering"
        ]
    },
    {
        serialNumber: 7,
        floorNumber: 0,
        floorName: "",
        stageName: "Electrical & Plumbing Rough-In",
        tasks: [
            "Electrical wiring",
            "Plumbing line (inner & outer)"
        ]
    },
    {
        serialNumber: 8,
        floorNumber: 0,
        floorName: "",
        stageName: "Plumbing Finishes",
        tasks: [
            "Plumbing finishing work",
            "Outer plumbing pipeline",
            "Inner plumbing pipeline",
            "Kitchen tap fixing",
            "Bathroom fittings",
            "Outer area fittings",
            "Overhead Water tank fixing and connection"
        ]
    },
    {
        serialNumber: 9,
        floorNumber: 0,
        floorName: "",
        stageName: "Electrical Finishes",
        tasks: [
            "Electrical finishing work",
            "Switch box fixing",
            "MCB box",
            "Light fittings"
        ]
    },
    {
        serialNumber: 10,
        floorNumber: 0,
        floorName: "",
        stageName: "Painting",
        tasks: [
            "Inner painting work",
            "Putty (2–3 coats)",
            "Primer",
            "Emulsion",
            "Grill painting",
            "Main door polish",
            "Windows and doors polishing or painting",
            "Outer painting work",
            "Elevation painting",
            "MS gate painting",
            "Additional laser cut / elevation element painting"
        ]
    },
    {
        serialNumber: 11,
        floorNumber: 0,
        floorName: "",
        stageName: "Tiles Work",
        tasks: [
            "Bathroom wall & floor tiles",
            "Main floor tiles",
            "Kitchen wall tiles",
            "Elevation wall tiles",
            "Parking tiles"
        ]
    },
    {
        serialNumber: 12,
        floorNumber: 0,
        floorName: "",
        stageName: "Granite & Staircase Work",
        tasks: [
            "Kitchen tabletop granite",
            "Front step granite",
            "Inner staircase",
            "Paneling work"
        ]
    },
    {
        serialNumber: 13,
        floorNumber: 0,
        floorName: "",
        stageName: "Carpentry Finishes",
        tasks: [
            "Carpenter finishing work",
            "Main door",
            "Bedroom doors",
            "Bathroom doors",
            "Windows frame & shutter",
            "All glass fittings"
        ]
    },
    {
        serialNumber: 14,
        floorNumber: 0,
        floorName: "",
        stageName: "Optional Extras",
        tasks: [
            "Elevation grill / laser work",
            "Main gate work",
            "Outer stair handrails",
            "MS / SS works"
        ]
    }
];

module.exports = CONSTRUCTION_TEMPLATE;
