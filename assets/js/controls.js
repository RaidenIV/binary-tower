// controls.js — generated module split of app.js (behavior unchanged)
import { canvas, elements, state } from "./core.js";
import { drawLoopMinimap, drawLoopWaveform, updateLoopSelectionUi } from "./loop.js";
import { markRenderDirty, normalizeHexColor } from "./utils.js";
import { fitViewport, setElevationFromViewport, setRotationFromViewport } from "./viewport.js";

export function initializeCollapsibleSections() {
  document.querySelectorAll(".collapse-toggle").forEach((button) => {
    const owner = button.closest(".section, .control-cluster");
    if (!owner) return;

    const header = button.closest(".collapsible-header");
    const content = owner.querySelector(":scope > .collapsible-content");
    if (!header || !content) return;

    const title = owner.dataset.collapsibleTitle || "section";
    const titleElement = header.querySelector("h2, h3");

    let inner = content.querySelector(":scope > .collapsible-content-inner");
    if (!inner || content.children.length !== 1) {
      inner = document.createElement("div");
      inner.className = "collapsible-content-inner";
      while (content.firstChild) {
        inner.appendChild(content.firstChild);
      }
      content.appendChild(inner);
    }

    const updateToggleState = (isCollapsed) => {
      button.setAttribute("aria-expanded", String(!isCollapsed));
      button.setAttribute(
        "aria-label",
        `${isCollapsed ? "Expand" : "Collapse"} ${title}`
      );
      button.title = `${isCollapsed ? "Expand" : "Collapse"} ${title}`;
      button.textContent = isCollapsed ? "+" : "−";
      content.setAttribute("aria-hidden", String(isCollapsed));
      content.inert = isCollapsed;

      if (titleElement) {
        titleElement.setAttribute("aria-expanded", String(!isCollapsed));
      }
    };

    const toggleSection = () => {
      const isCollapsed = owner.classList.toggle("is-collapsed");
      updateToggleState(isCollapsed);

      requestAnimationFrame(() => {
        fitViewport();
        if (!isCollapsed && owner.contains(elements.loopWaveWrap)) {
          drawLoopWaveform();
          drawLoopMinimap();
          updateLoopSelectionUi();
        }
      });
      window.setTimeout(fitViewport, 220);
    };

    const startsCollapsed = owner.classList.contains("is-collapsed");
    updateToggleState(startsCollapsed);
    content.classList.add("is-animated");
    button.addEventListener("click", toggleSection);

    if (titleElement) {
      titleElement.setAttribute("role", "button");
      titleElement.setAttribute("tabindex", "0");
      if (button.getAttribute("aria-controls")) {
        titleElement.setAttribute(
          "aria-controls",
          button.getAttribute("aria-controls")
        );
      }
      titleElement.addEventListener("click", toggleSection);
      titleElement.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        toggleSection();
      });
    }
  });
}

export function updateSidebarToggle() {
  elements.app.classList.toggle(
    "sidebar-collapsed",
    state.sidebarCollapsed
  );
  elements.sidebarToggle.setAttribute(
    "aria-expanded",
    String(!state.sidebarCollapsed)
  );
  elements.sidebarToggle.setAttribute(
    "aria-label",
    state.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
  );
  elements.sidebarToggle.title =
    state.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar";
  elements.sidebarToggleIcon.textContent =
    state.sidebarCollapsed ? "›" : "‹";

  requestAnimationFrame(fitViewport);
  window.setTimeout(fitViewport, 190);
}

export function beginViewportRotation(event) {
  if (event.pointerType === "mouse" && event.button !== 0) return;

  // The export overlay lives inside the draggable viewport. Never let its
  // controls bubble into viewport rotation or capture the pointer, because
  // pointer capture suppresses the cancel button's normal activation.
  const target = event.target instanceof Element ? event.target : null;
  if (
    state.isExportingVideo ||
    target?.closest("button, input, select, textarea, a, [role='button']")
  ) {
    return;
  }

  state.isViewportDragging = true;
  state.viewportDragPointerId = event.pointerId;
  state.viewportDragLastX = event.clientX;
  state.viewportDragLastY = event.clientY;
  elements.viewportFrame.classList.add("is-rotating");
  elements.viewportFrame.setPointerCapture(event.pointerId);
  event.preventDefault();
}

export function continueViewportRotation(event) {
  if (
    !state.isViewportDragging ||
    event.pointerId !== state.viewportDragPointerId
  ) {
    return;
  }

  const deltaX = event.clientX - state.viewportDragLastX;
  const deltaY = event.clientY - state.viewportDragLastY;
  state.viewportDragLastX = event.clientX;
  state.viewportDragLastY = event.clientY;

  setRotationFromViewport(state.rotation + deltaX * 0.35);
  setElevationFromViewport(state.elevation - deltaY * 0.22);
  event.preventDefault();
}

export function endViewportRotation(event) {
  if (
    !state.isViewportDragging ||
    event.pointerId !== state.viewportDragPointerId
  ) {
    return;
  }

  state.isViewportDragging = false;
  state.viewportDragPointerId = null;
  elements.viewportFrame.classList.remove("is-rotating");

  if (elements.viewportFrame.hasPointerCapture(event.pointerId)) {
    elements.viewportFrame.releasePointerCapture(event.pointerId);
  }
}

export function enhanceValueEditors() {
  document.querySelectorAll(".value-editor").forEach((editor) => {
    const valueInput = editor.querySelector(".value-input");
    if (!valueInput || editor.dataset.enhanced === "true") return;

    const label = valueInput.getAttribute("aria-label") || "Value";
    const suffix = editor.querySelector(".value-suffix");
    editor.classList.toggle("has-suffix", Boolean(suffix));

    const decrementButton = document.createElement("button");
    decrementButton.type = "button";
    decrementButton.className = "value-stepper";
    decrementButton.textContent = "−";
    decrementButton.setAttribute("aria-label", `Decrease ${label}`);
    decrementButton.title = `Decrease ${label}`;

    const incrementButton = document.createElement("button");
    incrementButton.type = "button";
    incrementButton.className = "value-stepper";
    incrementButton.textContent = "+";
    incrementButton.setAttribute("aria-label", `Increase ${label}`);
    incrementButton.title = `Increase ${label}`;

    editor.appendChild(decrementButton);
    editor.appendChild(incrementButton);
    editor.dataset.enhanced = "true";

    const stepValue = (direction) => {
      if (direction < 0) {
        valueInput.stepDown();
      } else {
        valueInput.stepUp();
      }
      valueInput.dispatchEvent(new Event("input", { bubbles: true }));
      valueInput.dispatchEvent(new Event("change", { bubbles: true }));
      valueInput.focus({ preventScroll: true });
      valueInput.select();
    };

    decrementButton.addEventListener("click", () => stepValue(-1));
    incrementButton.addEventListener("click", () => stepValue(1));

    valueInput.addEventListener("focus", () => {
      requestAnimationFrame(() => valueInput.select());
    });

    valueInput.addEventListener("wheel", () => {
      valueInput.blur();
    }, { passive: true });
  });
}

export function bindRange(input, valueInput, key, formatter, onChange) {
  const minimum =
    input.min === "" ? Number.NEGATIVE_INFINITY : Number(input.min);
  const maximum =
    input.max === "" ? Number.POSITIVE_INFINITY : Number(input.max);
  const step = Number(input.step);
  const stepPrecision =
    Number.isFinite(step) && step > 0 && String(input.step).includes(".")
      ? String(input.step).split(".")[1].length
      : 0;

  const normalizeValue = (rawValue, snapToStep = true) => {
    let nextValue = Number(rawValue);
    if (!Number.isFinite(nextValue)) return null;

    nextValue = Math.max(minimum, Math.min(maximum, nextValue));

    if (snapToStep && Number.isFinite(step) && step > 0) {
      const stepBase = Number.isFinite(minimum) ? minimum : 0;
      nextValue =
        stepBase + Math.round((nextValue - stepBase) / step) * step;
      nextValue = Number(nextValue.toFixed(stepPrecision));
      nextValue = Math.max(minimum, Math.min(maximum, nextValue));
    }

    return nextValue;
  };

  const updateState = (nextValue) => {
    input.value = String(nextValue);
    state[key] = Number(input.value);
    if (onChange) onChange(state[key]);
    markRenderDirty();
  };

  const commitValue = (rawValue) => {
    const nextValue = normalizeValue(rawValue, true);
    if (nextValue === null) return false;
    updateState(nextValue);
    valueInput.value = formatter(state[key]);
    return true;
  };

  input.addEventListener("input", () => {
    commitValue(input.value);
  });

  valueInput.addEventListener("input", () => {
    const rawValue = valueInput.value.trim();
    if (
      rawValue === "" ||
      rawValue === "-" ||
      rawValue === "." ||
      rawValue === "-."
    ) {
      return;
    }

    const nextValue = normalizeValue(rawValue, false);
    if (nextValue === null) return;
    updateState(nextValue);
  });

  valueInput.addEventListener("change", () => {
    if (!commitValue(valueInput.value)) {
      valueInput.value = formatter(state[key]);
    }
  });

  valueInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      valueInput.blur();
    } else if (event.key === "Escape") {
      event.preventDefault();
      valueInput.value = formatter(state[key]);
      valueInput.blur();
    }
  });

  commitValue(input.value);
}

export function applyBackgroundColor(value) {
  const normalized = normalizeHexColor(value);
  if (!normalized) return false;
  elements.backgroundColor.value = normalized;
  elements.backgroundColorHex.value = normalized.toUpperCase();
  state.backgroundColor = normalized;
  state.meshColor = normalized;
  state.surfacePaletteCache = null;
  state.hudLayer = null;
  elements.viewportFrame.style.background = normalized;
  canvas.style.background = normalized;
  markRenderDirty();
  return true;
}

export function applyLineColor(value) {
  const normalized = normalizeHexColor(value);
  if (!normalized) return false;
  elements.lineColor.value = normalized;
  elements.lineColorHex.value = normalized.toUpperCase();
  state.lineColor = normalized;
  state.hudLayer = null;
  document.documentElement.style.setProperty("--accent", normalized);
  markRenderDirty();
  return true;
}

export function bindHexColorInput(hexInput, colorInput, applyColor) {
  hexInput.addEventListener("input", () => {
    const normalized = normalizeHexColor(hexInput.value);
    hexInput.setCustomValidity(normalized ? "" : "Enter a six-digit hexadecimal color.");
    if (normalized) applyColor(normalized);
  });

  const commitHexValue = () => {
    const fallback = colorInput.value;
    const normalized = normalizeHexColor(hexInput.value);
    if (normalized) {
      applyColor(normalized);
      hexInput.setCustomValidity("");
    } else {
      hexInput.value = fallback.toUpperCase();
      hexInput.setCustomValidity("");
    }
  };

  hexInput.addEventListener("change", commitHexValue);
  hexInput.addEventListener("blur", commitHexValue);
  hexInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitHexValue();
      hexInput.select();
    } else if (event.key === "Escape") {
      event.preventDefault();
      hexInput.value = colorInput.value.toUpperCase();
      hexInput.setCustomValidity("");
      hexInput.blur();
    }
  });

  colorInput.addEventListener("input", () => {
    applyColor(colorInput.value);
  });
}
