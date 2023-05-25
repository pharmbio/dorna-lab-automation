export default function Calibration() {

  fetch("/data").then((res) =>
    res.json().then((data) => {
      // Setting a data from api
      console.log({
        name: data.Name,
        age: data.Age,
        date: data.Date,
        programming: data.programming,
      });
    })
  );

  return (
    <iframe className="my-auto" src="http://lab.dorna.ai"></iframe>
  )
}
