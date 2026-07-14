export function resetTurnstile(form: HTMLFormElement) {
  const container = form.querySelector<HTMLElement>('[data-turnstile-widget-id]')
  const hidden = form.querySelector<HTMLInputElement>('input[name="turnstileToken"]')
  if (hidden) hidden.value = ''
  if (container?.dataset.turnstileWidgetId) window.turnstile?.reset(container.dataset.turnstileWidgetId)
}
