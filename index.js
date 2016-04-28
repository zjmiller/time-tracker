import d3 from 'd3';
import $ from 'jquery';

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

class ActivityList {
  constructor() {
    this.activities = [];
  }

  getListOfActivityTypes(activities = this.activities){
    const activityTypes = [];

    activities.forEach(activity => {
      const alreadyIncluded = activityTypes.find(activityType => activity.type === activityType);
      if (!alreadyIncluded) activityTypes.push(activity.type);
    });

    return activityTypes;
  }

  getTotalTimeEngaged(activities = this.activities){
    const totalTimeEngaged = activities.reduce((total, curVal) => total + curVal.getDuration(), 0);
    return totalTimeEngaged;
  }

  getTimeEngagedInCertainActivityType(type, activities = this.activities){
    return (
      activities
        .filter(activity => activity.type === type)
        .reduce((total, activity) => total + activity.getDuration(), 0)
    );
  }

  getTimeEngagedInEachActivityType(activities = this.activities){
    const activityTypes = this.getListOfActivityTypes(activities);

    const activityTypesWithTimeEngaged = activityTypes.map(activityType => {
      return {
        type: activityType,
        timeEngagedInThisActivityType: this.getTimeEngagedInCertainActivityType(activityType, activities),
        timeEngagedInAllActivityTypes: this.getTotalTimeEngaged(activities)
      };
    });

    return activityTypesWithTimeEngaged;
  }

  isCurrentlyEngagedInActivityOfType(type){
    return undefined !== data.activities.find(activity => {
      return activity.type === type  && activity.endTime === null;
    });
  }

  getCurrentlyEngagedActivityOfType(type){
    return this.activities.find(activity => {
      return activity.type === type  && activity.endTime === null;
    });
  }

  getAllActivitiesInCurrentDay(){
    const currentDay = extractDay(new Date)
    const dayActivitiyList = new DayActivityList(currentDay);
    this.activities.forEach(activity => {
      if (areOnSameDay(activity.startTime, currentDay))
        dayActivitiyList.activities.push(activity);
    });
    return dayActivitiyList;
  }

}

class DayActivityList extends ActivityList {
  constructor(day){
    super();
    this.day = day;
  }
}

class TimeTracker extends ActivityList {
  constructor(){
    super();
    this.activityTypes = ['reading', 'programming', 'writing', 'chess'];
  }

  genColorCodeMap(activities = this.activities){
    return type => {
      if (type === this.activityTypes[0]) return '#d65454';
      if (type === this.activityTypes[1]) return '#4a8fd3';
      if (type === this.activityTypes[2]) return '#8ecc64';
      if (type === this.activityTypes[3]) return '#e7ba52';
      if (type === this.activityTypes[4]) return '#3ca0a0';
      if (type === this.activityTypes[5]) return '#8a497e';
    }
  }

  addActivityToken(type){
    this.activities.push(new ActivityToken(type, new Date()));
  }

  stopEngagingInActivityOfType(type){
    this.getCurrentlyEngagedActivityOfType(type).end();
  }

  groupActivitiesByDay(){
    const activitiesByDay = [];

    let currentDay = extractDay(this.activities[0].startTime);
    activitiesByDay.push(new DayActivityList(currentDay));

    this.activities.forEach(activity => {
      while (!areOnSameDay(currentDay, activity.startTime)) {
        currentDay = this.getNextDay(currentDay);
        activitiesByDay.push(new DayActivityList(currentDay));
      }

      activitiesByDay[activitiesByDay.length - 1].activities.push(activity);
    });

    while (!areOnSameDay(currentDay, new Date()) && currentDay.getTime() <= Date.now()) {
      currentDay = this.getNextDay(currentDay);
      activitiesByDay.push(new DayActivityList(currentDay));
    }

    return activitiesByDay;
  }

  getNextDay(date){
    return new Date(date.getTime() + (3600 * 1000 * 24));
  }

}

const data = genSeedData(Math.ceil(Math.random() * 10) + 5);

// Visualization code below

let dayBoxMargin = 10;
let dayBoxHorizontalPadding = 10;
let dayBoxVerticalPadding = 30;

// set the follow 3 variables dynamically in appLayoutSetup
let dayBoxWidth;
let dayBoxHeight;
let dayBoxRadius;

function appLayoutSetup(){
  let windowWidth = Math.max($(window).width(), 920);
  windowWidth -= 100;

  dayBoxWidth = (windowWidth / 7) - dayBoxMargin;
  dayBoxHeight = (windowWidth / 7) - dayBoxMargin;
  dayBoxRadius = Math.min(dayBoxWidth, dayBoxHeight) / 2;

  d3.select('.calendar-inner-container').style('width', (((dayBoxWidth + dayBoxMargin) * 7) + dayBoxMargin) + 'px')
}

// resize app on window resize
// not attaching anything heavy-duty to resize event
// because of reasons outlined http://ejohn.org/blog/learning-from-twitter/

let didResize = false;
let resizeRefreshRate = 250;

$(window).resize(function() {
  didResize = true;
});

setInterval(function() {
  if (didResize) {
    didResize = false;
    appLayoutSetup();
    render();
  }
}, resizeRefreshRate);

// also just refresh entire app periodically to reflect changes

let appRefreshRate = 5000;

setInterval(function() {
    render();
}, appRefreshRate);

// main render function

function render(){

  // clear app container... all render is rerender
  $('.activity-btns-container').html('');
  $('.today-breakdown-chart').html('');
  $('.calendar-inner-container').html('');

  const daysData = data.groupActivitiesByDay();

  const dayDivs = d3.select('.calendar-inner-container')
    .selectAll('div.day')
    .data(daysData)
    .enter()
    .append('div')
    .classed('day', true)
    .style({
      width: dayBoxWidth + 'px',
      height: dayBoxHeight + 'px'
    })
    .style('margin-left', (d, i) => {
      if (i === 0) {
        return (((dayBoxWidth + dayBoxMargin) * d.day.getDay()) + dayBoxMargin) + 'px';
      } else {
        return dayBoxMargin + 'px';
      }
    })
    .style('margin-bottom', (dayBoxMargin - 5) + 'px')
    .style('padding', `${dayBoxVerticalPadding}px ${dayBoxHorizontalPadding}px`);

  dayDivs.append('svg')
    .classed('svg-day', true)
    .attr({
      width: dayBoxWidth - dayBoxHorizontalPadding * 2,
      height: dayBoxWidth - dayBoxVerticalPadding * 2
    });

  dayDivs.append('div')
    .style('font', '500 16px Avenir')
    .style('text-align', 'center')
    .style({
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: dayBoxVerticalPadding + 'px',
      'line-height': dayBoxVerticalPadding + 'px'
    })
    .html(d => `${dateMonthToAbbr(d.day.getMonth())} ${d.day.getDate()}`);

  let cachedAngle = 0;

  d3.selectAll('svg.svg-day')
    .selectAll('g.activity')
    .data(d => d.getTimeEngagedInEachActivityType())
    .enter()
    .append('g')
    .attr('transform', `translate(${(dayBoxWidth - dayBoxHorizontalPadding * 2) / 2}, ${(dayBoxHeight - dayBoxVerticalPadding * 2) / 2})`)
    .append('path')
    .classed('activity-path', true)
    .attr('d', (d, i) => {
      const arc = d3.svg.arc();
      const mostTimeSpentEngagedDuringSingleDay = Math.max(...daysData.map(day => data.getTotalTimeEngaged(day.activities)));
      arc.outerRadius((dayBoxRadius - Math.max(dayBoxHorizontalPadding, dayBoxVerticalPadding)) * Math.sqrt(d.timeEngagedInAllActivityTypes / (mostTimeSpentEngagedDuringSingleDay)) - 2);
      arc.innerRadius(0);
      arc.startAngle(cachedAngle);
      const endAngle = cachedAngle + (d.timeEngagedInThisActivityType / d.timeEngagedInAllActivityTypes) * 2 * Math.PI;
      arc.endAngle(endAngle);
      cachedAngle = endAngle % (Math.PI * 2);
      return arc(d, i);
    })
    .attr('fill', (d, i) => data.genColorCodeMap()(d.type))
    .attr('stroke', '#333')
    .attr('stroke-width', 2);

    const buttonOuterDivs = d3.select('.activity-btns-container')
      .selectAll('div.activity-btn')
      .data(data.activityTypes)
      .enter()
      .append('div')
      .classed('activity-btn', true)
      .on('click', d => {
        if (!data.isCurrentlyEngagedInActivityOfType(d)) data.addActivityToken(d);
        else data.stopEngagingInActivityOfType(d)
        render();
      });

    buttonOuterDivs.append('div')
      .style('opacity', d => {
        return data.isCurrentlyEngagedInActivityOfType(d) ? 0.5 : 1;
      })
      .html(d => d)
      .style('background-color', d => data.genColorCodeMap()(d))
      .style('padding', '0 10px')

    buttonOuterDivs.append(d => {
        const el = document.createElement('div');
        el.classList.add('activity-btn-time-label');
        return el;
      })
      .html(d => {
        const activityTokenOfTypeIfCurrentlyEngagedIn = data.activities.find(activity => {
          return activity.type === d  && activity.endTime === null;
        });
        return activityTokenOfTypeIfCurrentlyEngagedIn ? formatMilliseconds(activityTokenOfTypeIfCurrentlyEngagedIn.getDuration()) : '';
      });

      generateTodayChart()
}

function generateTodayChart(){
  const todayData = data.getAllActivitiesInCurrentDay();
  const todayTypes = todayData.getListOfActivityTypes();

  const barOuterHeight = 20;
  const barInnerHeight = 10;
  const labelSize = 14;

  const margin = {top: 20, right: 30, bottom: 20, left: 100};
  const outerWidth = 900;
  const outerHeight = (todayTypes.length * barOuterHeight) + margin.top + margin.bottom;
  const innerWidth = outerWidth - margin.left - margin.right;
  const innerHeight = outerHeight - margin.top - margin.bottom;

  const todayDataSVG = d3.select('.today-breakdown-chart')
    .append('svg')
    .attr('width', outerWidth)
    .attr('height', outerHeight);

  todayDataSVG.selectAll('text.today-types')
    .data(todayTypes)
    .enter()
    .append('text')
    .classed('today-types', true)
    .attr('x', margin.left - 10)
    .attr('y', (d, i) => margin.top + (i * barOuterHeight))
    .attr('text-anchor', 'end')
    .style('font-size', labelSize + 'px')
    .style('font-family', 'Avenir')
    .text(d => d);

  const xScale = d3.time.scale();
  const startTimeForAxis = todayData.activities[0] ? earlierDate(todayAtHour(8), extractHour(todayData.activities[0].startTime)) : todayAtHour(8);
  xScale.domain([startTimeForAxis, tomorrowAtMidnight()]);
  xScale.range([0, innerWidth]);

  todayDataSVG.selectAll('rect.activity-bar')
    .data(todayData.activities)
    .enter()
    .append('rect')
    .attr('x', (d, i) => margin.left + xScale(new Date(d.startTime)))
    .attr('y', (d, i) => margin.top + (todayTypes.indexOf(d.type) * barOuterHeight) - (barInnerHeight / 2) - (labelSize / 4))
    .attr('height', barInnerHeight)
    .attr('width', d => {
      const startTimeScale = xScale(new Date(d.startTime));
      const endTimeOrNow = d.endTime ? new Date(d.endTime) : new Date;
      const endTimeOrNowScale = xScale(endTimeOrNow);
      const barWidth = endTimeOrNowScale - startTimeScale;
      return Math.max(barWidth, 1);
    })
    .attr('fill', d => data.genColorCodeMap()(d.type));

  const xAxis = d3.svg.axis();
  xAxis.scale(xScale);
  xAxis.orient('bottom');
  xAxis.ticks(d3.time.hours, 1);
  xAxis.tickFormat(d => {
    return d3.time.format('%-I')(d) + (d.getTime() < todayAtHour(12).getTime() || d.getTime() >= tomorrowAtMidnight().getTime()  ? 'am' : 'pm')
  });

  todayDataSVG.append('g')
    .classed('axis x-axis', true)
    .attr('transform', `translate(${margin.left},${innerHeight + margin.top})`)
    .call(xAxis);

  d3.select('.x-axis')
    .selectAll('line')
    .attr('y2', -500)
}

// Initialize page

appLayoutSetup();
render();

// Helper functions below

function dateMonthToAbbr(n){
  switch (n) {
    case 0:
      return 'Jan';
    case 1:
      return 'Feb';
    case 2:
      return 'Mar';
    case 3:
      return 'Apr';
    case 4:
      return 'May';
    case 5:
      return 'Jun';
    case 6:
      return 'Jul';
    case 7:
      return 'Aug';
    case 8:
      return 'Sep';
    case 9:
      return 'Oct';
    case 10:
      return 'Nov';
    case 11:
      return 'Dec';
    default:
      break;
  }
}

function todayAtMidnight(){
  return new Date((new Date()).toDateString());
}

function tomorrowAtMidnight(){
  return new Date(todayAtMidnight().getTime() + (1000 * 3600 * 24));
}

function todayAtHour(hour){
  return new Date(todayAtMidnight().setHours(hour));
}

function extractHour(date){
  const hour = date.getHours()
  let day = extractDay(date);
  day.setHours(hour);
  return day;
}

function extractDay(date){
  return new Date(date.toDateString());
}

function extractDayNDaysAgo(date, n){
  return new Date(extractDay(date).getTime() - n * ((1000 * 3600 * 24)));
}

function areOnSameDay(d1, d2){
  return d1.toDateString() === d2.toDateString();
}

function earlierDate(date1, date2){
  return date1.getTime() < date2.getTime() ? date1 : date2;
}

function formatMilliseconds(milliseconds){
  let str = '';
  const hours = Math.floor(milliseconds / (3600 * 1000));
  let remainingMilliseconds = milliseconds - (hours * 3600 * 1000);
  const minutes = Math.floor(remainingMilliseconds / (60 * 1000));
  remainingMilliseconds -= minutes * 60 * 1000;
  const seconds = Math.floor(remainingMilliseconds / 1000);

  return `${hours ? hours + 'h ' : ''}${minutes ? minutes + 'm ' : ''}${seconds}s`;
}

function genSeedData(days){
  const seedData = new TimeTracker;
  const wakeUpTime = 7;
  const maxActivityTokensPerDay = 5;
  const twoHours = 2000 * 3600;
  const minActivityLength = 250 * 3600; // 15 min

  let currentTime;

  for(let i = 1; i <= days; i++){
    const day = extractDayNDaysAgo(new Date, days - i);
    currentTime = day;
    currentTime.setHours(7);
    const numOfActivityTokens = Math.floor(Math.random() * maxActivityTokensPerDay + 1);
    for(let j = 0; j < numOfActivityTokens; j++){
      const randType = seedData.activityTypes[Math.floor(Math.random() * seedData.activityTypes.length)];
      const randStartTime = new Date(currentTime.getTime() + Math.floor(Math.random() * twoHours));
      currentTime = randStartTime;
      const randEndTime = new Date(currentTime.getTime() + Math.floor(Math.random() * twoHours) + minActivityLength);
      seedData.activities.push(new ActivityToken(randType, randStartTime, randEndTime));
      currentTime = randEndTime;
    }
  }

  return seedData;
}
