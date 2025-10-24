import fs from 'fs/promises';
import path from 'path';
import { RuleTables } from './types'; // Assuming RuleTables is defined in types.ts

export async function loadAllRuleTables(edition: string = '2024'): Promise<RuleTables> {
    const tablesDir = path.join(__dirname, `../../data/tables/${edition}`);
    const [table2, table4, table5A, table5C] = await Promise.all([
        fs.readFile(path.join(tablesDir, 'table2.json'), 'utf-8'),
        fs.readFile(path.join(tablesDir, 'table4.json'), 'utf-8'),
        fs.readFile(path.join(tablesDir, 'table5A.json'), 'utf-8'),
        fs.readFile(path.join(tablesDir, 'table5C.json'), 'utf-8'),
    ]);
    return { 
        table2: JSON.parse(table2), 
        table4: JSON.parse(table4), 
        table5A: JSON.parse(table5A), 
        table5C: JSON.parse(table5C),
        edition: edition as any,
        code: 'cec' as any
    };
}