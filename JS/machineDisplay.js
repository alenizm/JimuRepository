// קריאה לנתונים
fetch("https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Machines")
  .then((response) => response.json()) // המרה ל json
  .then((data) => {
    console.log(data); // [הדפסה בקוסול לבדיקה]
    const listElement = document.querySelector(".list"); // מציאת האלמנט של הרשימה ששם יהיו המכונות

    // פרס את המחרוזת JSON בשדה body
    const machines = JSON.parse(data.body);

    // לולאה על כל מכונה
    machines.forEach((machine) => {
      // יצירת אלמנט חדש לכל מכונה
      const itemElement = document.createElement("div");
      itemElement.classList.add("item");

      // יצירת התוכן למכונה
      itemElement.innerHTML = `
        <img src="${machine.ImageURL}" alt="${machine.Name}" />
        <div class="introduce">
            <div class="title">MACHINE SELECTION</div>
            <div class="topic">${machine.Name}</div>
            <div class="des">${machine.Description}</div>
            <button class="chooseMachine">SELECT MACHINE &#8599;</button>
        </div>
        <div class="detail">
            <div class="title">${machine.Name}</div>
            <div class="des">${machine.Description}</div>
            <div class="specifications">
                <div>
                    <p>Machine Name</p>
                    <p>${machine.Name}</p>
                </div>
                <div>
                    <p>Type</p>
                    <p>${machine.Type}</p>
                </div>
                <div>
                    <p>Brand</p>
                    <p>${machine.Brand}</p>
                </div>
                <div>
                    <p>Target Body Part</p>
                    <p>${machine.TargetBodyPart}</p>
                </div>
                <div>
                    <p>Availability</p>
                    <p>${
                      machine.Availability === "true"
                        ? "Available"
                        : "Not Available"
                    }</p>
                </div>
            </div>
            <div class="setworkout">
                <button>Watch Your History</button>
                <button>Set Workout</button>
            </div>
        </div>
      `;

      // הוספת המכונה לרשימה ב-HTML
      listElement.appendChild(itemElement);

      // הוספת מאזין לאירועים לכפתור SELECT MACHINE
      const selectButton = itemElement.querySelector(".chooseMachine");
      selectButton.addEventListener("click", () => {
        const detailSection = itemElement.querySelector(".detail");
        detailSection.style.display =
          detailSection.style.display === "none" ? "block" : "none"; // הצגת או הסתרת המידע של המכונה
      });
    });
  })
  .catch((error) => {
    console.error("Error fetching machines:", error); // הצגת שגיאה במקרה של בעיה
  });
