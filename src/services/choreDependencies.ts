import { Chore } from '../types';

export class ChoreDependencyService {
  /**
   * Check if a chore can be completed (all dependencies are met)
   */
  static canCompleteChore(chore: Chore, allChores: Chore[]): boolean {
    if (!chore.dependencies || chore.dependencies.length === 0) {
      return true;
    }

    return chore.dependencies.every(dependencyId => {
      const dependency = allChores.find(c => c.id === dependencyId);
      return dependency && dependency.completedAt;
    });
  }

  /**
   * Get all chores that are blocked by this chore
   */
  static getBlockedChores(choreId: string, allChores: Chore[]): Chore[] {
    return allChores.filter(chore => 
      chore.dependencies?.includes(choreId) && !chore.completedAt
    );
  }

  /**
   * Get all dependencies for a chore
   */
  static getDependencies(chore: Chore, allChores: Chore[]): Chore[] {
    if (!chore.dependencies || chore.dependencies.length === 0) {
      return [];
    }

    return allChores.filter(c => chore.dependencies!.includes(c.id));
  }

  /**
   * Get all chores that depend on this chore
   */
  static getDependents(choreId: string, allChores: Chore[]): Chore[] {
    return allChores.filter(chore => 
      chore.dependencies?.includes(choreId) && !chore.completedAt
    );
  }

  /**
   * Check if there are any circular dependencies
   */
  static hasCircularDependencies(chores: Chore[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (choreId: string): boolean => {
      if (recursionStack.has(choreId)) {
        return true;
      }

      if (visited.has(choreId)) {
        return false;
      }

      visited.add(choreId);
      recursionStack.add(choreId);

      const chore = chores.find(c => c.id === choreId);
      if (chore?.dependencies) {
        for (const dependencyId of chore.dependencies) {
          if (hasCycle(dependencyId)) {
            return true;
          }
        }
      }

      recursionStack.delete(choreId);
      return false;
    };

    for (const chore of chores) {
      if (!visited.has(chore.id)) {
        if (hasCycle(chore.id)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get the dependency chain for a chore (all dependencies recursively)
   */
  static getDependencyChain(chore: Chore, allChores: Chore[]): Chore[] {
    const chain: Chore[] = [];
    const visited = new Set<string>();

    const addToChain = (currentChore: Chore) => {
      if (visited.has(currentChore.id)) {
        return;
      }

      visited.add(currentChore.id);
      
      if (currentChore.dependencies) {
        for (const dependencyId of currentChore.dependencies) {
          const dependency = allChores.find(c => c.id === dependencyId);
          if (dependency) {
            addToChain(dependency);
          }
        }
      }

      chain.push(currentChore);
    };

    addToChain(chore);
    return chain;
  }

  /**
   * Get available chores (no dependencies or all dependencies completed)
   */
  static getAvailableChores(chores: Chore[]): Chore[] {
    return chores.filter(chore => 
      !chore.completedAt && this.canCompleteChore(chore, chores)
    );
  }

  /**
   * Get blocked chores (have dependencies that aren't completed)
   */
  static getBlockedChoresList(chores: Chore[]): Chore[] {
    return chores.filter(chore => 
      !chore.completedAt && !this.canCompleteChore(chore, chores)
    );
  }

  /**
   * Get the next chore in a dependency chain
   */
  static getNextChoreInChain(chore: Chore, allChores: Chore[]): Chore | null {
    const dependents = this.getDependents(chore.id, allChores);
    return dependents.length > 0 ? dependents[0] : null;
  }

  /**
   * Validate that a new dependency won't create circular dependencies
   */
  static canAddDependency(
    choreId: string, 
    dependencyId: string, 
    allChores: Chore[]
  ): boolean {
    // Create a temporary copy with the new dependency
    const tempChores = allChores.map(chore => {
      if (chore.id === choreId) {
        return {
          ...chore,
          dependencies: [...(chore.dependencies || []), dependencyId]
        };
      }
      return chore;
    });

    return !this.hasCircularDependencies(tempChores);
  }
} 