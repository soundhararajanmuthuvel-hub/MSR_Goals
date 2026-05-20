let goals = JSON.parse(localStorage.getItem("goals")) || [];

function saveGoals() {
  localStorage.setItem("goals", JSON.stringify(goals));
}

function formatMoney(amount) {
  return amount.toLocaleString("en-IN");
}

function getGoalIcon(name) {

  name = name.toLowerCase();

  if (name.includes("bike")) return "🏍️";
  if (name.includes("car")) return "🚗";
  if (name.includes("trip")) return "✈️";
  if (name.includes("study")) return "🎓";
  if (name.includes("phone")) return "📱";
  if (name.includes("laptop")) return "💻";

  return "🎯";
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

    const percent = Math.floor(
      (goal.saved / goal.target) * 100
    );

    goalList.innerHTML += `

      <div class="goal-card">

        <div class="goal-top">

          <div class="goal-left">

            <div class="goal-icon">
              ${getGoalIcon(goal.name)}
            </div>

            <div class="goal-info">

              <h3>${goal.name}</h3>

              <p>

                Target:
                ₹${formatMoney(goal.target)}

                •

                Saved:
                ₹${formatMoney(goal.saved)}

                •

                Remaining:
                ₹${formatMoney(goal.target - goal.saved)}

              </p>

            </div>

          </div>

          <div class="actions">

            <button
              class="plus-btn"
              onclick="updateMoney(${index},100)"
            >
              + ₹100
            </button>

            <button
              class="minus-btn"
              onclick="updateMoney(${index},-100)"
            >
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

        <div class="progress">

          <div
            class="progress-bar"
            style="width:${percent}%"
          >
            ${percent}%
          </div>

        </div>

      </div>

    `;
  });

  const balance = totalGoal - totalSaved;

  document.getElementById("totalSaved").innerHTML = `

    <div style="
      font-size:18px;
      opacity:0.9;
      margin-bottom:8px;
    ">
      Saved Amount
    </div>

    <div style="
      font-size:30px;
      font-weight:bold;
      margin-bottom:20px;
    ">
      ₹${formatMoney(totalSaved)}
    </div>

    <div style="
      font-size:18px;
      opacity:0.9;
      margin-bottom:8px;
    ">
      Balance Amount
    </div>

    <div style="
      font-size:40px;
      font-weight:bold;
    ">
      ₹${formatMoney(balance)}
    </div>

  `;
}

displayGoals();

if ("serviceWorker" in navigator) {

  window.addEventListener("load", () => {

    navigator.serviceWorker.register("sw.js");

  });

}