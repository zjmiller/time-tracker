import d3 from 'd3';

class ActivityToken {
  constructor(type, startTime, endTime = null){
    this.activityID = 'id' + Date.now();
    this.type = type;
    this.startTime = startTime;
    this.endTime = endTime;
  }

  end(){
    this.endTime = new Date();
  }

  changeType(newType){
    this.type = newType;
  }

  isOngoing(){
    return this.endTime === null;
  }

  getDuration(){
    if (this.isOngoing()) return Date.now() - this.startTime.getTime();
    return this.endTime.getTime() - this.startTime.getTime();
  }
}

class TimeTracker {
  constructor(){
    this.activities = [];
  }

  addActivityToken(type){
    this.activities.push(new ActivityToken(type, new Date()));
  }

  areOnSameDay(d1, d2){
    return d1.toDateString() === d2.toDateString();
  }

  extractDay(date){
    return new Date(date.toDateString());
  }

  getNextDay(date){
    return new Date(date.getTime() + (3600 * 1000 * 24));
  }

  getTimeEngagedInCertainActivityType(type, activities = this.activities){
    return (
      activities
        .filter(activity => activity.type === type)
        .reduce((total, activity) => total + activity.getDuration(), 0)
    );
  }

  getTimeEngagedInEachActivityType(activities = this.activities){
    const activityTypes = [];

    activities.forEach(activity => {
      const alreadyIncluded = activityTypes.find(activityType => activity.type === activityType);
      if (!alreadyIncluded) activityTypes.push(activity.type);
    });

    const activityTypesWithTimeEngaged = activityTypes.map(activityType => {
      return {
        type: activityType,
        timeEngagedInThisActivityType: this.getTimeEngagedInCertainActivityType(activityType, activities),
        timeEngagedInAllActivityTypes: this.getTotalTimeEngaged(activities)
      };
    });

    return activityTypesWithTimeEngaged;
  }

  getTotalTimeEngaged(activities = this.activities){
    const totalTimeEngaged = activities.reduce((total, curVal) => total + curVal.getDuration(), 0);
    return totalTimeEngaged;
  }

  groupActivitiesByDay(){
    const activitiesByDay = [];

    let currentDay = this.extractDay(this.activities[0].startTime);
    activitiesByDay.push({
      day: currentDay,
      activities: [],
      getTimeEngagedInCertainActivityType: this.getTimeEngagedInCertainActivityType,
      getTimeEngagedInEachActivityType: this.getTimeEngagedInEachActivityType,
      getTotalTimeEngaged: this.getTotalTimeEngaged
    });

    this.activities.forEach(activity => {
      while (!this.areOnSameDay(currentDay, activity.startTime)) {
        currentDay = this.getNextDay(currentDay);
        activitiesByDay.push({
          day: currentDay,
          activities: [],
          getTimeEngagedInCertainActivityType: this.getTimeEngagedInCertainActivityType,
          getTimeEngagedInEachActivityType: this.getTimeEngagedInEachActivityType,
          getTotalTimeEngaged: this.getTotalTimeEngaged
        });
      }

      activitiesByDay[activitiesByDay.length - 1].activities.push(activity);
    });

    return activitiesByDay;
  }
}

const a1 = new ActivityToken('reading', new Date('23 April 2016 13:15:00'), new Date('23 April 2016 14:15:00'));
const a2 = new ActivityToken('reading', new Date('24 April 2016 13:35:00'), new Date('24 April 2016 14:15:00'));
const a3 = new ActivityToken('writing', new Date('24 April 2016 19:35:00'), new Date('24 April 2016 21:22:00'));
const a4 = new ActivityToken('reading', new Date('25 April 2016 09:35:00'), new Date('25 April 2016 11:22:00'));
const a5 = new ActivityToken('writing', new Date('25 April 2016 19:35:00'), new Date('25 April 2016 21:22:00'));
const a6 = new ActivityToken('writing', new Date('25 April 2016 23:35:00'), new Date('25 April 2016 23:42:00'));
const t = new TimeTracker;
t.activities.push(a1, a2, a3, a4, a5, a6);
window.t = t;

const dayBoxWidth = 300;
const dayBoxHeight = 300;
const dayBoxRadius = Math.min(dayBoxWidth, dayBoxHeight) / 2;

d3.select('.app-container')
  .selectAll('svg.day')
  .data(t.groupActivitiesByDay())
  .enter()
  .append('div')
  .classed('day', true)
  .style({
    width: dayBoxWidth + 'px',
    height: dayBoxHeight + 'px'
  })
  .append('svg')
  .classed('svg-day', true)
  .attr({
    width: dayBoxWidth,
    height: dayBoxHeight
  });

let cachedAngle = 0;

d3.selectAll('svg.svg-day')
  .selectAll('g.activity')
  .data(d => d.getTimeEngagedInEachActivityType())
  .enter()
  .append('g')
  .attr('transform', `translate(${dayBoxWidth / 2}, ${dayBoxHeight / 2})`)
  .append('path')
  .attr('d', (d, i) => {
    const arc = d3.svg.arc();
    arc.outerRadius(dayBoxRadius * Math.sqrt(d.timeEngagedInAllActivityTypes / (1000 * 3600 * 12)));
    arc.innerRadius(0);
    arc.startAngle(cachedAngle);
    const endAngle = cachedAngle + (d.timeEngagedInThisActivityType / d.timeEngagedInAllActivityTypes) * 2 * Math.PI;
    arc.endAngle(endAngle);
    cachedAngle = endAngle % (Math.PI * 2);
    return arc(d, i);
  })
  .attr('fill', (d, i) => {
      if (i === 0) return '#faa';
      if (i > 0) return '#afa';
  })
  .attr('stroke', '#666');
