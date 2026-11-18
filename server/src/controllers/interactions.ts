import { Request, Response } from 'express';
import { z } from 'zod';
import interactions from '../data/interactions.json';
import foodWarnings from '../data/foodWarnings.json';

type Warning = { severity: 'red' | 'amber' | 'green'; message: string };

const InteractionMap = interactions as Record<string, Record<string, Warning>>;
const FoodWarningMap = foodWarnings as Record<string, string[]>;

const checkSchema = z.object({
  medicines: z.string().min(1),
});

export function checkInteractions(req: Request, res: Response) {
  const { medicines } = checkSchema.parse({ medicines: req.query.medicines });
  const medList = medicines.split(',').map(m => m.trim().toLowerCase());

  const warnings: Array<{ drug1: string; drug2?: string; food?: string; severity: string; message: string }> = [];

  // Drug-drug interactions
  for (let i = 0; i < medList.length; i++) {
    for (let j = i + 1; j < medList.length; j++) {
      const a = medList[i];
      const b = medList[j];

      const warn =
        InteractionMap[a]?.[b] ??
        InteractionMap[b]?.[a] ??
        null;

      if (warn) {
        warnings.push({ drug1: a, drug2: b, severity: warn.severity, message: warn.message });
      }
    }
  }

  // Food warnings
  for (const med of medList) {
    const foods = FoodWarningMap[med];
    if (foods && foods.length > 0) {
      warnings.push({
        drug1: med,
        food: foods.join(', '),
        severity: 'amber',
        message: `Avoid ${foods.join(', ')} when taking ${med}`,
      });
    }
  }

  res.json({ warnings, checkedAt: new Date().toISOString() });
}
