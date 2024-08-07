import { expect, it, test } from "vitest";

import App from './App'
import { render, screen } from "@testing-library/react";

test('True test', () => {
    expect(true).toBe(true);
})

it('Should have heading', () => {
    render(<App />);

    const headingElement = document.querySelector('h1');

    expect(headingElement).toBeInTheDocument();
    expect(headingElement).toBeVisible();
})