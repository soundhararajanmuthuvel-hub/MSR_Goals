let goals = JSON.parse(localStorage.getItem("goals")) || [];

function saveGoals() {
  localStorage.setItem("goals", JSON.stringify(goals));
}

function addGoal() {

  const name = document.getElementById("goalName").value;
  const amount = document.getElementById("goalAmount").value;

  if (name === "" || amount === "") {
    alert("Please enter all fields");
    return;
  }

  goals.push({
    name: name,
    target: Number(amount),
    saved: 0
  });

  saveGoals();

  displayGoals();

  document.getElementById("goalName").value = "";
  document.getElementById("goalAmount").value = "";
}

function updateMoney(index, value) {

  goals[index].saved += value;

  if (goals[index].saved < 0) {
    goals[index].saved = 0;
  }

  if (goals[index].saved > goals[index].target) {
    goals[index].saved = goals[index].target;
  }

  saveGoals();

  displayGoals();
}

function deleteGoal(index) {

  goals.splice(index, 1);

  saveGoals();

  displayGoals();
}

function displayGoals() {

  const goalList = document.getElementById("goalList");

  goalList.innerHTML = "";

  let totalSaved = 0;

  let totalGoal = 0;

  goals.forEach((goal, index) => {

    totalSaved += goal.saved;

    totalGoal += goal.target;

    const percent = (goal.saved / goal.target) * 100;

    goalList.innerHTML += `

      <div class="goal-card">

        <h3>${goal.name}</h3>

        <p><b>Target:</b> ₹${goal.target}</p>

        <p><b>Saved:</b> ₹${goal.saved}</p>

        <p><b>Remaining:</b> ₹${goal.target - goal.saved}</p>

        <div class="progress">

          <div
            class="progress-bar"
            style="width:${percent}%"
          ></div>

        </div>

        <p>${Math.floor(percent)}% Completed</p>

        <div class="actions">

          <button onclick="updateMoney(${index},100)">
            + ₹100
          </button>

          <button onclick="updateMoney(${index},-100)">
            - ₹100
          </button>

          <button
            class="delete-btn"
            onclick="deleteGoal(${index})"
          >
            Delete
          </button>

        </div>

      </div>

    `;
  });

  const balance = totalGoal - totalSaved;

  document.getElementById("totalSaved").innerHTML = `

    <div style="
      font-size:18px;
      margin-bottom:10px;
    ">
      Saved
    </div>

    <div style="
      font-size:22px;
      font-weight:bold;
      margin-bottom:15px;
    ">
      ₹${totalSaved}
    </div>

    <div style="
      font-size:42px;
      font-weight:bold;
    ">
      ₹${balance}
    </div>

    <div style="
      font-size:18px;
      margin-top:5px;
    ">
      Balance
    </div>

  `;
}

displayGoals();

if ("serviceWorker" in navigator) {

  window.addEventListener("load", () => {

    navigator.serviceWorker.register("sw.js")
      .then(() => {
        console.log("PWA Ready");
      });

  });

}