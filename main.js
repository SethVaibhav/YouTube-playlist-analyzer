const link="https://www.youtube.com/playlist?list=PLzkuLC6Yvumv_Rd5apfPRWEcjf9b1JRnq";
const puppeteer=require("puppeteer");
const pdf=require("pdfkit");
const fs=require("fs");

let cTab;
(async function(){
    try {
        let browserOpen=puppeteer.launch({
            headless:false,
            defaultViewport:false,
            args:["--start-maximized"],
        });

        let browserInstance =await browserOpen;
        let allTabArr=await browserInstance.pages();
        cTab=allTabArr[0];
        await cTab.goto(link); // go to yt page
        await cTab.waitForSelector("h1#title");
        let name=await cTab.evaluate(function(selector){ 
            return document.querySelector(selector).innerText;
        },"h1#title"); // args->function(para),parameter of the function
        let allData=await cTab.evaluate(getData,"#stats>.style-scope.ytd-playlist-sidebar-primary-info-renderer"); // to get the total vies anbd video of the playlist;;;;;
        console.log(name,allData.videosCount,allData.viewsCount);
        let TotalVideos = allData.videosCount.split(" ")[0];
        //console.log(TotalVideos);
        let currentVideosinPage=  await currentVideosLength();  // to get the length or count of videos we get after every one scroll and 100 videos are there in one scroll or one page
        console.log(currentVideosinPage);
        
        while(TotalVideos - currentVideosinPage >=20){
            // to scroll the videos
            await ScrollToBottom();
            currentVideosinPage=await currentVideosLength();
            //console.log(currentVideosinPage);
        }

        let finalList= await  getstats();
        //console.log(finalList);

        // for making pdf folder for the playList---
        let pdfdoc=new pdf;
        pdfdoc.pipe(fs.createWriteStream("playList.pdf")); // for creating a Pdf file ______
        pdfdoc.text(JSON.stringify(finalList));
        pdfdoc.end()

        

    } catch (error) {
       console.log(error); 
    }
})()

// to get the no of views and no of videos function for cTab.evaluate 
function getData(selector){
let elems=document.querySelectorAll(selector);
let videosCount=elems[0].innerText;
let viewsCount=elems[1].innerText;
return {
    videosCount,
    viewsCount
}
}

async function ScrollToBottom(){
    await cTab.evaluate(goToBottom);
    function goToBottom(){
        window.scrollBy(0,window.innerHeight); // it uses windows object to get details of currently opened page 
    }
} 
// to get the total videos in one page
async function currentVideosLength(){
let length=await cTab.evaluate(getlength,".yt-simple-endpoint.inline-block.style-scope.ytd-thumbnail"); // get the length
return length;
}

function getlength(durationSelect){
    let durationElem=document.querySelectorAll(durationSelect);
    return durationElem.length;
}

// async to get details of the video !!!!!
async function getstats(){
    let list=cTab.evaluate(getNameAndDuration,"#video-title","#content #text.style-scope.ytd-thumbnail-overlay-time-status-renderer");
    return list;
}

// to get the name and duration of all videos and store in array and return it.!!!
function getNameAndDuration(nameSelector,durationSelect){
let NameElem=document.querySelectorAll(nameSelector);
let DurationElem=document.querySelectorAll(durationSelect);
let currentList=[];
for(let i=0;i<DurationElem.length;i++){
    let Duration=DurationElem[i].innerText;
    let name=NameElem[i].innerText;
    currentList.push({name,Duration});
}
return currentList;
}