
sitMatrix = zeros(1,14);
standMatrix = zeros(1,14);
sitdownMatrix = zeros(1,14);
standupMatrix = zeros(1,14);
lieMatrix = zeros(1,14);
fallMatrix = zeros(1,14);
walkMatrix = zeros(1,14);

n1 = 0; n2 = 0; n3 = 0; n4 = 0; n5 = 0; n6 = 0; n7 = 0;

Input_Data_Folder="./data/realdata/input_data/"; % folder path to access input data
s=strcat(Input_Data_Folder,'*.pcap'); %Access input data folder and bring .dat files
data_files=dir(s);
for i = 1:length(data_files)
    
    dataFilename=data_files(i).name; %extract filename of the each data file
    filepath = strcat(Input_Data_Folder,'/',dataFilename); %create path for each data file using filename
    [filename,name,ext] = fileparts(filepath); %extract filename and other information from its path for each data file
    
    name = regexprep(name,'[\d"]','');
    %reading each activity data from its filepath using read_bf_file that
    %is provided by used CSI Tool software
    [timeStamp, denoisedMag] = fileReader(filepath);
    
    
    if(name == "walk")
        n1 = n1 + 1;
        [principalComponents, time] = PrincipalComponents(denoisedMag, timeStamp);
        extractedFeautures = featureExtraction(principalComponents, time);
        walkMatrix(n1,:) = extractedFeautures;
    end

    if(name == "fall")
        n2 = n2 + 1;
        [principalComponents, time] = PrincipalComponents(denoisedMag, timeStamp);
        extractedFeautures = featureExtraction(principalComponents, time);
        fallMatrix(n2,:) = extractedFeautures;
    end
    
    if(name == "sit")
        n3 = n3 + 1;
        [principalComponents, time] = PrincipalComponents(denoisedMag, timeStamp);
        figure
        plot(principalComponents);
        extractedFeautures = featureExtraction(principalComponents, time);
        
        sitMatrix(n3,:) = extractedFeautures;
    end
    
    if(name == "sitdown")
        n4 = n4 + 1;
        [principalComponents, time] = PrincipalComponents(denoisedMag, timeStamp);
        extractedFeautures = featureExtraction(principalComponents, time);
        sitdownMatrix(n4,:) = extractedFeautures;
    end
    
    if(name == "stand")
        n5 = n5 + 1;
        [principalComponents, time] = PrincipalComponents(denoisedMag, timeStamp);
        extractedFeautures = featureExtraction(principalComponents, time);
        standMatrix(n5,:) = extractedFeautures;
    end
    
    if(name == "standup")
        n6 = n6 + 1;
        [principalComponents, time] = PrincipalComponents(denoisedMag, timeStamp);
        extractedFeautures = featureExtraction(principalComponents, time);
        standupMatrix(n6,:) = extractedFeautures;
    end
    
    if(name == "lie")
        n7 = n7 + 1;
        [principalComponents, time] = PrincipalComponents(denoisedMag, timeStamp);
        extractedFeautures = featureExtraction(principalComponents, time);
        lieMatrix(n7,:) = extractedFeautures;               
    end
end

writematrix(walkMatrix, "walkMatrix.txt");
writematrix(sitMatrix, "sitMatrix.txt");
writematrix(sitdownMatrix, "sitdownMatrix.txt");
writematrix(standMatrix, "standMatrix.txt");