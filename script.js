// Elementos da interface
const expressionEl = document.getElementById("expression");
const currentEl = document.getElementById("current");
const calculatorEl = document.getElementById("calculator");

// Estado da calculadora
let currentOperand = "0";
let previousOperand = "";
let operator = null;
let overwrite = true; // se true, o próximo número digitado substitui o display
let hasError = false;

const MAX_DIGITS = 15;

function resetAll() {
  currentOperand = "0";
  previousOperand = "";
  operator = null;
  overwrite = true;
  hasError = false;
  clearActiveOperator();
}

function appendNumber(digit) {
  if (hasError) resetAll();

  if (overwrite) {
    currentOperand = digit === "," ? "0," : digit;
    overwrite = false;
    return;
  }

  // Evita múltiplas vírgulas e limita o tamanho do número
  if (digit === "," && currentOperand.includes(",")) return;
  if (currentOperand.replace(/[-,]/g, "").length >= MAX_DIGITS) return;

  currentOperand = currentOperand === "0" && digit !== "," ? digit : currentOperand + digit;
}

function deleteLast() {
  if (hasError) {
    resetAll();
    return;
  }

  if (overwrite) return;

  currentOperand = currentOperand.slice(0, -1);
  if (currentOperand === "" || currentOperand === "-") {
    currentOperand = "0";
    overwrite = true;
  }
}

function toggleSign() {
  if (hasError || currentOperand === "0") return;

  currentOperand = currentOperand.startsWith("-")
    ? currentOperand.slice(1)
    : "-" + currentOperand;
}

function applyPercent() {
  if (hasError) return;

  const value = parseLocaleNumber(currentOperand) / 100;
  currentOperand = formatForInput(value);
  overwrite = false;
}

function chooseOperator(nextOperator) {
  if (hasError) resetAll();
  if (currentOperand === "" && previousOperand === "") return;

  // Permite trocar o operador antes de digitar o segundo número
  if (previousOperand !== "" && overwrite) {
    operator = nextOperator;
    highlightActiveOperator(nextOperator);
    return;
  }

  if (previousOperand !== "") {
    compute();
  }

  operator = nextOperator;
  previousOperand = currentOperand;
  overwrite = true;
  highlightActiveOperator(nextOperator);
}

function compute() {
  const prev = parseLocaleNumber(previousOperand);
  const current = parseLocaleNumber(currentOperand);

  if (Number.isNaN(prev) || Number.isNaN(current)) return;

  let result;

  switch (operator) {
    case "+":
      result = prev + current;
      break;
    case "-":
      result = prev - current;
      break;
    case "×":
      result = prev * current;
      break;
    case "÷":
      if (current === 0) {
        showError();
        return;
      }
      result = prev / current;
      break;
    default:
      return;
  }

  currentOperand = formatForInput(roundResult(result));
  operator = null;
  previousOperand = "";
  overwrite = true;
  clearActiveOperator();
}

function showError() {
  currentEl.textContent = "Erro";
  expressionEl.textContent = "Não é possível dividir por zero";
  hasError = true;
  currentOperand = "0";
  previousOperand = "";
  operator = null;
  overwrite = true;
  clearActiveOperator();
}

// Evita problemas de ponto flutuante (ex: 0.1 + 0.2) mantendo precisão razoável
function roundResult(value) {
  return Math.round((value + Number.EPSILON) * 1e10) / 1e10;
}

// Converte o texto exibido (com vírgula) em número para cálculo
function parseLocaleNumber(text) {
  return parseFloat(text.replace(",", "."));
}

// Converte um número calculado de volta para o formato exibido (com vírgula)
function formatForInput(value) {
  return value.toString().replace(".", ",");
}

// Formata o número para exibição, adicionando separador de milhar
function formatDisplayNumber(text) {
  if (text === "" || text === "-") return text;

  const negative = text.startsWith("-");
  const [integerPart, decimalPart] = text.replace("-", "").split(",");
  const withThousands = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  let formatted = withThousands;
  if (decimalPart !== undefined) formatted += "," + decimalPart;
  return (negative ? "-" : "") + formatted;
}

function highlightActiveOperator(op) {
  clearActiveOperator();
  const button = document.querySelector(`[data-operator="${CSS.escape(op)}"]`);
  if (button) button.classList.add("is-active");
}

function clearActiveOperator() {
  document.querySelectorAll(".key--operator").forEach((btn) => btn.classList.remove("is-active"));
}

function updateDisplay() {
  if (hasError) return;

  currentEl.textContent = formatDisplayNumber(currentOperand);

  expressionEl.textContent =
    previousOperand !== "" ? `${formatDisplayNumber(previousOperand)} ${operator}` : "";
}

// Trata os cliques nos botões
calculatorEl.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const { action, number, operator: op } = button.dataset;

  switch (action) {
    case "number":
      appendNumber(number);
      break;
    case "decimal":
      appendNumber(",");
      break;
    case "operator":
      chooseOperator(op);
      break;
    case "equals":
      compute();
      break;
    case "clear":
      resetAll();
      break;
    case "delete":
      deleteLast();
      break;
    case "percent":
      applyPercent();
      break;
    case "sign":
      toggleSign();
      break;
  }

  updateDisplay();
});

// Suporte ao teclado
const KEY_OPERATOR_MAP = {
  "+": "+",
  "-": "-",
  "*": "×",
  "/": "÷",
};

window.addEventListener("keydown", (event) => {
  const { key } = event;

  if (key >= "0" && key <= "9") {
    appendNumber(key);
  } else if (key === "." || key === ",") {
    appendNumber(",");
  } else if (KEY_OPERATOR_MAP[key]) {
    event.preventDefault();
    chooseOperator(KEY_OPERATOR_MAP[key]);
  } else if (key === "Enter" || key === "=") {
    event.preventDefault();
    compute();
  } else if (key === "Backspace") {
    deleteLast();
  } else if (key === "Escape") {
    resetAll();
  } else if (key === "%") {
    applyPercent();
  } else {
    return;
  }

  updateDisplay();
});

updateDisplay();
