function validate() {
    let competitors = document.getElementById("competitors").value
    //console.log("validate.js: " + competitors)
    let teams = competitors.split(",")
    //console.log("teams: " + teams)
    if (teams.length >= 4 && teams.length <= 8) {
        return true
    } else {
        alert("There has to be between 4 and  8 competitors")
        return false
    }
}