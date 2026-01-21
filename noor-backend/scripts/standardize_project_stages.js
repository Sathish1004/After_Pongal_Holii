const db = require('../config/db');
const CONSTRUCTION_TEMPLATE = require('../templates/construction-template');

async function standardize() {
    try {
        console.log('Starting Stage Standardization Process...');

        // Get all sites
        const [sites] = await db.query('SELECT id, name FROM sites');
        console.log(`Found ${sites.length} sites.`);

        for (const site of sites) {
            // Get current phases
            const [currentPhases] = await db.query('SELECT id, name FROM phases WHERE site_id = ? ORDER BY serial_number ASC, order_num ASC', [site.id]);

            // Check if matches standard
            // We check if count is 14 AND names match effectively. 
            // Currently strict match on names.
            let isStandard = false;

            if (currentPhases.length === CONSTRUCTION_TEMPLATE.length) {
                const currentNames = currentPhases.map(p => p.name.trim().toLowerCase());
                const standardNames = CONSTRUCTION_TEMPLATE.map(p => p.stageName.trim().toLowerCase());

                // Check if every standard name exists in current names (ignoring order for now, but strict order is better)
                // Actually, let's just assume if length is different or names are wildly off, we reset.
                // Or better: strict comparison by index.
                isStandard = currentNames.every((name, index) => name === standardNames[index]);
            }

            if (isStandard) {
                console.log(`Site ${site.id} (${site.name}) is already standard. Skipping.`);
                continue;
            }

            console.log(`Standardizing Site ${site.id} (${site.name})... Resetting phases.`);

            // Delete existing phases
            // Note: Tasks/Transactions/etc will have phase_id set to NULL due to ON DELETE SET NULL constraint
            await db.query('DELETE FROM phases WHERE site_id = ?', [site.id]);

            // Insert new phases
            for (const phaseTpl of CONSTRUCTION_TEMPLATE) {
                await db.query(
                    `INSERT INTO phases (
                        site_id, name, order_num, budget, 
                        floor_number, floor_name, serial_number, status, progress, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 0, NOW())`,
                    [
                        site.id,
                        phaseTpl.stageName,
                        phaseTpl.serialNumber, // Use serial as order_num too
                        0, // budget
                        phaseTpl.floorNumber,
                        phaseTpl.floorName,
                        phaseTpl.serialNumber
                    ]
                );
            }
            console.log(`Site ${site.id} phases updated.`);
        }

        console.log('Standardization Complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error during standardization:', error);
        process.exit(1);
    }
}

standardize();
