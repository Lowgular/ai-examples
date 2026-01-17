import { Injectable } from '@nestjs/common';
import { FitnessClass } from '@text2rest/shared';
import { CLASSES_STUB } from './classes.stub';

@Injectable()
export class AppService {
  getData(filters?: Partial<FitnessClass>): FitnessClass[] {
    if (!filters || Object.keys(filters).length === 0) {
      return CLASSES_STUB;
    }

    return CLASSES_STUB.filter((fitnessClass) =>
      Object.entries(filters).every(([key, filterValue]) => {
        if (filterValue === undefined || filterValue === null || filterValue === '') {
          return true;
        }

        const classValue = fitnessClass[key as keyof FitnessClass];

        // Handle tags array (check if any tag matches)
        if (key === 'tags' && Array.isArray(classValue)) {
          const filterTags = typeof filterValue === 'string' 
            ? filterValue.split(',').map(s => s.trim().toLowerCase())
            : [String(filterValue).toLowerCase()];
          return classValue.some(tag => filterTags.includes(tag.toLowerCase()));
        }

        // Convert filter value to match class value type
        const normalizedFilter = this.normalizeValue(filterValue, classValue);
        const normalizedClass = classValue;

        // String fields: case-insensitive partial match for all string properties
        if (typeof normalizedClass === 'string' && typeof normalizedFilter === 'string') {
          return normalizedClass.toLowerCase().includes(normalizedFilter.toLowerCase());
        }

        // Direct comparison for numbers and booleans
        return normalizedClass === normalizedFilter;
      })
    );
  }

  private normalizeValue(filterValue: any, classValue: any): any {
    // Convert string to number if class value is number
    if (typeof classValue === 'number' && typeof filterValue === 'string') {
      return classValue % 1 === 0 ? parseInt(filterValue, 10) : parseFloat(filterValue);
    }

    // Convert string to boolean if class value is boolean
    if (typeof classValue === 'boolean' && typeof filterValue === 'string') {
      return filterValue === 'true' || filterValue === '1';
    }

    return filterValue;
  }
}
