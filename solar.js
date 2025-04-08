let solar = {
  fetchSolar: async function () {
    const response = await fetch(
      "https://api.codetabs.com/v1/proxy/?quest=https://www.solaxcloud.com/proxyApp/proxy/api/" +
      "getRealtimeInfo.do%3FtokenId%3D20221026130839175716859%26sn%3DSVT7CYCWCP",
      { credentials: "omit" }
    );
    if (!response.ok) {
      alert("Failed to get result.");
      throw new Error("Failed to get result.");
    }
    return await response.json();
  },

  fetchBin: async function () {
    const response = await fetch(
      "https://api.jsonbin.io/v3/b/640af76bebd26539d08c35d6/latest",
      {
        headers: {
          "X-Master-Key":
            "$2b$10$C0BFb/UlbWDerSGQdx9vquHOxkKBJRjWWz80GqpqMpfLPU2IbJqey",
        },
      }
    );
    return await response.json();
  },

  updateBin: async function (requestData) {
    const binId = "640af76bebd26539d08c35d6";
    const apiKey = "$2b$10$C0BFb/UlbWDerSGQdx9vquHOxkKBJRjWWz80GqpqMpfLPU2IbJqey";

    const response1 = await fetch(
      `https://api.jsonbin.io/v3/b/${binId}/latest`,
      {
        headers: {
          "X-Master-Key": apiKey,
        },
      }
    );

    if (response1.ok) {
      const existingData = await response1.json();
      const mergedData = Object.assign(existingData.record, JSON.parse(requestData));
      const response2 = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": apiKey,
        },
        body: JSON.stringify(mergedData),
      });
      if (response2.ok) {
        console.log("Data saved successfully!");
        alert("Data saved successfully! Dismiss to reload page.");
        document.location.reload();
      } else {
        console.log("Failed to save data.");
      }
    } else {
      console.log("Failed to get existing data.");
    }
  },

  displaySolar: function () {
    Promise.all([this.fetchSolar(), this.fetchBin()])
      .then(([solarData, binData]) => {
        const result = binData.record;
        const { uploadTime, yieldtotal, feedinenergy, consumeenergy } = solarData.result;

        //monthly variables from JSONBin
        let importprev = result.importprev;
        let exportprev = result.exportprev;
        let yieldprev = result.yieldprev;
        let savingsprev = result.savingsprev;
        let billprev = result.billprev;
        let importrate = result.importrate;
        let exportrate = result.exportrate;
        let billupdated = result.billupdated;

        let currentimport = consumeenergy - importprev;
        let currentexport = feedinenergy - exportprev;
        let bill = currentimport * importrate;
        let exportsavings = currentexport * exportrate;
        let totalbill = (bill - exportsavings) + billprev;
        let selfusesavings = (yieldtotal - yieldprev - currentexport) * importrate;
        let monthlysavings = selfusesavings + exportsavings;
        let totalsavings = selfusesavings + exportsavings + savingsprev;

        const monthname = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];

        const d = new Date();
        let month = monthname[d.getMonth()];
        let day = d.getDate();
        let time = d.getHours();
        let currentTime = d.getTime();


        console.log(`Updated: ${uploadTime}`);

        // Updated X minutes ago
        const apiTimestamp = uploadTime;
        const [dateStr, timeStr] = apiTimestamp.split(' ');
        const [year, month1, date] = dateStr.split('-');
        const [hours, minutes, seconds] = timeStr.split(':');
        // Create a new Date object using the extracted components
        const uploadTime1 = new Date(year, month1 - 1, date, hours, minutes, seconds);
        // Get the current time
        const now = new Date();

        // Calculate the time difference in milliseconds
        const timeDifferenceMs = now.getTime() - uploadTime1.getTime();

        // Calculate the time difference in minutes and hours
        const minutesDifference = Math.floor(timeDifferenceMs / 1000 / 60);
        const hoursDifference = Math.floor(minutesDifference / 60);

        // Determine the time unit to use based on the time difference
        const timeUnit = hoursDifference > 0 ? 'hour' : 'minute';
        const timeValue = hoursDifference > 0 ? hoursDifference : minutesDifference;

        // Format the time difference as a string
        const formattedTimeDifference = timeUnit === 'hour'
          ? `${hoursDifference} hour${hoursDifference > 1 ? 's' : ''}`
          : `${minutesDifference} minute${minutesDifference > 1 ? 's' : ''}`;

        // Output the result
        console.log(`Updated ${formattedTimeDifference} ago`);


        //Change Bill month
        if (day >= 9) {
          if (d.getMonth() < 11) {
            month = monthname[d.getMonth() + 1];
          } else {
            month = monthname[d.getMonth() - 11];
          }
        }

        //Change billupdated value every 9th
        if (day >= 9 && billupdated == true) {
          const requestData = JSON.stringify({ billupdated: false });
          this.updateBin(requestData);
          alert(`Bill updated: False`);
        }

        function roundOff(num) {
          return Math.round(num * 100) / 100;
        }

        //Update the variable values every 8th
        if (day == 8 && time > 10 && billupdated == false) {
          //uncomment if solar limiter is fixed
/*          if (totalbill < 0){
            const requestData = JSON.stringify({
              billupdated: true,
              importprev: consumeenergy,
              exportprev: feedinenergy,
              yieldprev: yieldtotal,
              savingsprev: savingsprev + monthlysavings,
              billprev: roundOff(totalbill),
            });
            this.updateBin(requestData);
            alert(`Monthly update every 8th has been successful!\n\n` +
                  `Final estimated bill for ${month}: ₱${roundOff(totalbill)}\n` +
                  `Total Monthly Savings: ₱${roundOff(monthlysavings)}\n\n` +
                  `Counter will now reset after reloading the page.`);
          } 

          else {
 */           const requestData = JSON.stringify({
              billupdated: true,
              importprev: consumeenergy,
              exportprev: feedinenergy,
              yieldprev: yieldtotal,
              savingsprev: savingsprev + monthlysavings,
            });
            this.updateBin(requestData);
            alert(`Monthly update every 8th has been successful!\n\n` +
                  `Final estimated bill for ${month}: ₱${roundOff(totalbill)}\n` +
                  `Total Monthly Savings: ₱${roundOff(monthlysavings)}\n\n` +
                  `Counter will now reset after reloading the page.`);
          }
        }
        document.querySelector(".bill").innerText = `₱ ${roundOff(totalbill)}`;
        document.querySelector(".meralco").innerText = `Meralco Bill\nfor ${month}`;
        document.querySelector(".uptime").innerText = `Last updated ${formattedTimeDifference} ago`;
        document.querySelector(".prebill").innerText = `Import Cost:\n₱ ${roundOff(bill)}`;
        document.querySelector(".export").innerText = `Export Savings:\n₱ ${roundOff(exportsavings)}`;
        document.querySelector(".selfuse").innerText = `Self-Use Savings:\n₱ ${roundOff(selfusesavings)}`;
        document.querySelector(".monthly").innerText = `Monthly Savings:\n₱ ${roundOff(monthlysavings)}`;
        document.querySelector(".overall").innerText = `Overall Savings:\n₱ ${roundOff(totalsavings)}`;
        document.querySelector(".solar").classList.remove("loading");
      })
      .catch((error) => {
        console.error(error);
      });
  },
};

document.querySelector(".flex-container button").addEventListener("click", function () {
  var pin = prompt("Enter PIN:");
  if (pin == "0411") {
    var newimportrate = prompt("Enter Import Rate: ");
    var newexportrate = prompt("Enter Export Rate: ");

    if (
      newimportrate === null ||
      newexportrate === null ||
      newimportrate === "" ||
      newexportrate == ""
    ) {
      alert("ERROR. PLEASE TRY AGAIN.");
      return;
    } else {
      alert("やめてください! (╯°Д °)╯╧╧")
      /*
      const requestData = JSON.stringify({
        importrate: parseFloat(newimportrate),
        exportrate: parseFloat(newexportrate),
      });

      solar.updateBin(requestData);
      */
    }
  } else if (pin === null) {
    return;
  } else alert("WRONG PIN. PLEASE TRY AGAIN.");
});

solar.displaySolar();
