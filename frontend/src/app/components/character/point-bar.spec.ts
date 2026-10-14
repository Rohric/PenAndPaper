import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { PointBar, barPercent } from './point-bar';

describe('barPercent', () => {
  it('measures the points against the maximum', () => {
    expect(barPercent(50, 100)).toBe(50);
    expect(barPercent(3, 4)).toBe(75);
  });

  it('stays between 0 and 100', () => {
    expect(barPercent(120, 100)).toBe(100);
    expect(barPercent(-5, 100)).toBe(0);
    expect(barPercent(10, 0)).toBe(0);
  });
});

describe('PointBar', () => {
  it('shows its name, the points and how full it is', async () => {
    const fixture = TestBed.createComponent(PointBar);
    fixture.componentRef.setInput('label', 'Willen');
    fixture.componentRef.setInput('value', 70);
    fixture.componentRef.setInput('max', 100);
    fixture.componentRef.setInput('tone', 'second');
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('Willen 70 von 100');
    const fill = host.querySelector<HTMLElement>('.meter__fill');
    expect(fill?.classList).toContain('meter__fill--second');
    expect(fill?.style.width).toBe('70%');
  });
});
