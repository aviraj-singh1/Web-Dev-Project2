const addBtn = document.querySelector(".add-btn");
const modalCont = document.querySelector(".modal-cont");
const modalTaskArea = document.querySelector(".textArea-cont");
const mainTicketContainer = document.querySelector(".main-cont");
const allPriorityColors = document.querySelectorAll(".priority-color");
const removeBtn = document.querySelector(".remove-btn");
const filterColors = document.querySelectorAll(".color");

const colors = ["lightpink", "lightgreen", "lightblue", "black"];

const createBtn = document.querySelector(".create-btn");


let deleteMode = false;
let activeFilterColor = null;
let ticketsArr = [];
let ticketColor = "lightpink";
let openedLock = "fa-lock-open";
let closedLock = "fa-lock";

const micBtn = document.querySelector(".mic-btn");
const micStatus = document.querySelector(".mic-status");

let recognition = null;
let isListening = false;

if (micBtn && micStatus) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    micStatus.textContent = "Speech not supported in this browser";
    micBtn.style.opacity = "0.5";
    micBtn.style.cursor = "not-allowed";
  } else {
    recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    micBtn.addEventListener("click", function () {
      if (!isListening) {
        recognition.start();
        isListening = true;
        micBtn.classList.add("listening");
        micStatus.textContent = "Listening...";
      } else {
        recognition.stop();
        isListening = false;
        micBtn.classList.remove("listening");
        micStatus.textContent = "Click mic to speak";
      }
    });

    recognition.addEventListener("result", function (event) {
      const transcript = event.results[0][0].transcript;
      const existing = modalTaskArea.value.trim();
      modalTaskArea.value = existing ? existing + " " + transcript : transcript;
    });

    recognition.addEventListener("end", function () {
      if (isListening) {
        isListening = false;
        micBtn.classList.remove("listening");
        micStatus.textContent = "Click mic to speak";
      }
    });

    recognition.addEventListener("error", function () {
      isListening = false;
      micBtn.classList.remove("listening");
      micStatus.textContent = "Click mic to speak";
    });
  }
}

removeBtn.addEventListener("click", function () {
  deleteMode = !deleteMode;
  if (deleteMode) {
    removeBtn.classList.add("active");
  } else {
    removeBtn.classList.remove("active");
  }
});

function loadTicketsFromStorage() {
  const storedTickets = localStorage.getItem("myTickets");
  if (!storedTickets) return;
  ticketsArr = JSON.parse(storedTickets);
  ticketsArr.forEach(function (ticket) {
    generateTicket(ticket.ticketTask, ticket.ticketId, ticket.ticketColor);
  });
}

loadTicketsFromStorage();

let modalFlag = false;

addBtn.addEventListener("click", function () {
  if (!modalFlag) {
    modalCont.style.display = "flex";
    modalFlag = true;
  } else {
    modalCont.style.display = "none";
    modalFlag = false;
  }
});

function generateTicket(task, id, color) {
  const ticketCont = document.createElement("div");
  ticketCont.className = "ticket-cont";

  ticketCont.innerHTML = `
    <div class="ticket-color" style="background-color: ${color}"></div>
    <div class="ticket-id">#${id}</div>
    <div class="task-area">${task}</div>
    <div class="ticket-lock">
      <i class="fa-solid fa-lock"></i>
    </div>
  `;

  mainTicketContainer.appendChild(ticketCont);

  ticketCont.addEventListener("click", function () {
    if (!deleteMode) return;

    ticketCont.remove();

    const index = ticketsArr.findIndex(function (ticket) {
      return ticket.ticketId === id;
    });

    if (index !== -1) {
      ticketsArr.splice(index, 1);
      localStorage.setItem("myTickets", JSON.stringify(ticketsArr));
    }
  });

  handleColor(ticketCont, id);
  handleLock(ticketCont, id);
}

function createTicketFromModal() {
  const taskFromModal = modalTaskArea.value.trim();
  if (taskFromModal === "") return;

  const id = shortid();
  const color = ticketColor;

  generateTicket(taskFromModal, id, color);

  modalCont.style.display = "none";
  modalFlag = false;
  modalTaskArea.value = "";

  ticketsArr.push({
    ticketId: id,
    ticketTask: taskFromModal,
    ticketColor: color,
  });

  localStorage.setItem("myTickets", JSON.stringify(ticketsArr));
}

modalCont.addEventListener("keydown", function (e) {
  if (e.key === "Shift") {
    createTicketFromModal();
  }
});

if (createBtn) {
  createBtn.addEventListener("click", function () {
    createTicketFromModal();
  });
}


allPriorityColors.forEach(function (colorItem) {
  colorItem.addEventListener("click", function () {
    allPriorityColors.forEach(function (priorityColor) {
      priorityColor.classList.remove("active");
    });
    colorItem.classList.add("active");
    ticketColor = colorItem.classList[0];
  });
});

function handleLock(ticket, id) {
  const lockContainer = ticket.querySelector(".ticket-lock");
  const lockIcon = lockContainer.children[0];
  const taskArea = ticket.querySelector(".task-area");

  lockIcon.addEventListener("click", function (event) {
    event.stopPropagation();

    if (lockIcon.classList.contains(closedLock)) {
      lockIcon.classList.remove(closedLock);
      lockIcon.classList.add(openedLock);
      taskArea.setAttribute("contenteditable", true);
    } else {
      lockIcon.classList.remove(openedLock);
      lockIcon.classList.add(closedLock);
      taskArea.setAttribute("contenteditable", false);

      const newTask = taskArea.innerText.trim();

      const index = ticketsArr.findIndex(function (t) {
        return t.ticketId === id;
      });

      if (index !== -1) {
        ticketsArr[index].ticketTask = newTask;
        localStorage.setItem("myTickets", JSON.stringify(ticketsArr));
      }
    }
  });
}

function handleColor(ticket, id) {
  const ticketColorBand = ticket.querySelector(".ticket-color");

  ticketColorBand.addEventListener("click", function (event) {
    event.stopPropagation();

    const currentColor = ticketColorBand.style.backgroundColor;
    const currColorIndex = colors.indexOf(currentColor);
    const newColorIdx = (currColorIndex + 1) % colors.length;
    const newColor = colors[newColorIdx];

    ticketColorBand.style.backgroundColor = newColor;

    const index = ticketsArr.findIndex(function (t) {
      return t.ticketId === id;
    });

    if (index !== -1) {
      ticketsArr[index].ticketColor = newColor;
      localStorage.setItem("myTickets", JSON.stringify(ticketsArr));
    }
  });
}

function applyFilter(filterColor) {
  const allTickets = document.querySelectorAll(".ticket-cont");

  allTickets.forEach(function (ticket) {
    const colorBand = ticket.querySelector(".ticket-color");
    const ticketColorValue = colorBand.style.backgroundColor;

    if (!filterColor || ticketColorValue === filterColor) {
      ticket.style.display = "block";
    } else {
      ticket.style.display = "none";
    }
  });
}

filterColors.forEach(function (colorElem) {
  colorElem.addEventListener("click", function () {
    let selectedColor = null;

    colors.forEach(function (c) {
      if (colorElem.classList.contains(c)) {
        selectedColor = c;
      }
    });

    if (!selectedColor) return;

    if (activeFilterColor === selectedColor) {
      activeFilterColor = null;
      colorElem.classList.remove("active");
      applyFilter(null);
      return;
    }

    activeFilterColor = selectedColor;

    filterColors.forEach(function (elem) {
      elem.classList.remove("active");
    });
    colorElem.classList.add("active");

    applyFilter(selectedColor);
  });
});
