let goals =
JSON.parse(
  localStorage.getItem("goals")
) || [];

let commonSavings =
Number(
  localStorage.getItem(
    "commonSavings"
  )
) || 0;

function saveGoals(){

  localStorage.setItem(
    "goals",
    JSON.stringify(goals)
  );
}

function formatMoney(amount){

  return Number(amount)
  .toLocaleString("en-IN");
}

function getGoalIcon(name){

  name = name.toLowerCase();

  if(name.includes("bike")) return "🏍️";

  if(name.includes("car")) return "🚗";

  if(name.includes("trip")) return "✈️";

  if(name.includes("study")) return "🎓";

  if(name.includes("phone")) return "📱";

  if(name.includes("laptop")) return "💻";

  if(name.includes("house")) return "🏠";

  return "🎯";
}

function saveCommonSavings(){

  const amount =
  document.getElementById(
    "commonSavings"
  ).value.trim();

  commonSavings =
  amount === ""
  ? 0
  : Number(amount);

  localStorage.setItem(
    "commonSavings",
    commonSavings
  );

  displayGoals();
}

function addGoal(){

  const name =
  document.getElementById(
    "goalName"
  ).value;

  const amount =
  document.getElementById(
    "goalAmount"
  ).value;

  if(name === "" || amount === ""){

    alert(
      "Please enter all fields"
    );

    return;
  }

  goals.push({

    name:name,

    target:Number(amount),

    saved:0

  });

  saveGoals();

  displayGoals();

  document.getElementById(
    "goalName"
  ).value = "";

  document.getElementById(
    "goalAmount"
  ).value = "";
}

function updateMoney(index,value){

  goals[index].saved += value;

  if(goals[index].saved < 0){

    goals[index].saved = 0;
  }

  if(
    goals[index].saved >
    goals[index].target
  ){

    goals[index].saved =
    goals[index].target;
  }

  saveGoals();

  displayGoals();
}

function deleteGoal(index){

  goals.splice(index,1);

  saveGoals();

  displayGoals();
}

function displayGoals(){

  const goalList =
  document.getElementById(
    "goalList"
  );

  goalList.innerHTML = "";

  let totalSaved = 0;

  goals.forEach((goal,index)=>{

    totalSaved += goal.saved;

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
                ₹${formatMoney(
                  goal.target - goal.saved
                )}

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

  const balance =
  commonSavings - totalSaved;

  document.getElementById(
    "commonSavings"
  ).value =
  commonSavings || "";

  document.getElementById(
    "totalSaved"
  ).innerHTML = `

    <div class="balance-label">
      Total Savings
    </div>

    <div class="balance-small">
      ₹${formatMoney(commonSavings)}
    </div>

    <div class="balance-label">
      Remaining Balance
    </div>

    <div class="balance-big">
      ₹${formatMoney(balance)}
    </div>

    <div class="used-text">
      Goal Savings Used:
      ₹${formatMoney(totalSaved)}
    </div>

  `;
}

displayGoals();

if("serviceWorker" in navigator){

  window.addEventListener(
    "load",
    ()=>{

      navigator.serviceWorker
      .register("sw.js");

    }
  );

}