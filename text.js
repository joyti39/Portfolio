function downloadFile(filename, callback) {
    setTimeout(function() {
        callback("Download complete for " + filename);
    }, 2000);
}

downloadFile("report.pdf", function(message) {
    console.log(message);
});

