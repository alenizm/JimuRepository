fetch("https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Machines")
  .then((response) => response.json())
  .then((data) => {
    console.log(data); // בדיקה בקונסול

    const listElement = document.querySelector(".list");

    // פרס את המחרוזת JSON בשדה body אם צריך
    const machines =
      typeof data.body === "string" ? JSON.parse(data.body) : data.body;

    machines.forEach((machine) => {
      const itemElement = document.createElement("div");
      itemElement.classList.add("item");

      const imageUrl = machine.ImageURL || "default-image.jpg"; // תמונה ברירת מחדל

      itemElement.innerHTML = `
        <img src="${imageUrl}" alt="${machine.Name}" />
        <div class="introduce">
            <div class="title">MACHINE SELECTION</div>
            <div class="topic">${machine.Name}</div>
            <div class="des">${machine.Description}</div>
            <button class="chooseMachine">SELECT MACHINE &#8599;</button>
        </div>
      `;

      listElement.appendChild(itemElement);

      // הוספת אירוע לכפתור לאחר שהאלמנטים נוספו לדף
      const button = itemElement.querySelector(".chooseMachine");

      if (button) {
        button.addEventListener("click", () => {
          console.log("כפתור נלחץ"); // בדיקה בקונסול

          // בדוק אם ה- detail כבר נוצר כדי למנוע כפילויות
          if (!itemElement.querySelector(".detail")) {
            const detailElement = document.createElement("div");
            detailElement.classList.add("detail");
            detailElement.innerHTML = `
              <div class="title">${machine.Name}</div>
              <div class="des">${machine.Description}</div>
              <div class="specifications">
                  <div><p>Machine Name</p>
                  <p>${machine.Name}</p></div>
                  <div><p>Type</p>
                  <p>${machine.Type}</p></div>
                  <div><p>Brand</p>
                  <p>${machine.Brand}</p></div>
                  <div><p>Target Body Part</p>
                  <p>${machine.TargetBodyPart}</p></div>
                  <div><p>Availability</p>
                  <p>${
                    machine.Availability === "true"
                      ? "Available"
                      : "Not Available"
                  }</p></div>
              </div>
              <div class="setworkout">
                  <button>Watch Your History</button>
                  <button>Set Workout</button>
              </div>
            `;

            itemElement.appendChild(detailElement);
          }
        });
      } else {
        console.error("כפתור לא נמצא.");
      }
    });
  })
  .catch((error) => {
    console.error("Error fetching machines:", error);
  });
