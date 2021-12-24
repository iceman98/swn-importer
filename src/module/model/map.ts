import { Entry } from './entry';

export class Map<K, V> {
    private backend: any;

    constructor(data: any) {
        if (data) {
            this.backend = data;
        } else {
            this.backend = {};
        }
    }

    entries(): Entry<K, V>[] {
        const result: Entry<K, V>[] = [];
        for (const k in this.backend) {
            result.push({ key: <K><unknown>k, value: this.backend[k] });
        }
        return result;
    }

    forEach(consumer: (k: K, v: V) => any): void {
        this.entries().forEach(e => consumer(e.key, e.value));
    }

    values(): V[] {
        return this.entries().map(e => e.value);
    }

    keys(): K[] {
        return this.entries().map(e => e.key);
    }

    clear() {
        this.backend = {};
    }

    get(key: K): V {
        return this.backend[key];
    }

    put(key: K, value: V): void {
        this.backend[key] = value;
    }

    remove(key: K): void {
        delete this.backend[key];
    }

    length(): number{
        return this.entries().length;
    }
}
