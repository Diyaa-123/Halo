
Input_Data_Folder="./data/realdata/input_data/30ms/"; % folder path to access input data
Output_Data_Folder = "./data/realdata/output_data/allsubs/30ms/csvs/flattened/"; % folder path to extract output data as .mat file
s=strcat(Input_Data_Folder,'*.pcap'); %Access input data folder and bring .dat files
data_files=dir(s);
% data = shuffle(data_files,300);
% file_index=15;
for i=221:406%length(data_files) %iterate each data file in the given inputData folder
    
    dataFilename=data_files(i).name; %extract filename of the each data file
    filepath = strcat(Input_Data_Folder,'/',dataFilename); %create path for each data file using filename
    [filename,name,ext] = fileparts(filepath); %extract filename and other information from its path for each data file
    
    %reading each activity data from its filepath using read_bf_file that
    %is provided by used CSI Tool software
    [timeStamp, denoisedMag] = fileReader(filepath);
%      magxtime = [transpose(denoisedMag) transpose(timeStamp)];
%      B = rmoutliers(magxtime);
%      [B,TF] = rmoutliers(transpose(denoisedMag))
%     figure
%     plot(denoisedMag)

     denoised = transpose(denoisedMag);
     csi = zeros(256,150);
     csi = denoised(:,1:150);
%      [B,TF] = rmoutliers(denoised);
     %[principalComponents, time] = PrincipalComponents(denoised, transpose(timeStamp));
     %csiMatrix = principalComponents;
     csiMatrix(i-202,1:256*150) = reshape(csi,[256*150,1]);
     namecsv = strcat(Output_Data_Folder,"sit",'.csv')

%     average = mean(transpose(denoised));
% 
%     figure
%     plot((csiMatrix));
    
%     [principalComponents, time] = PrincipalComponents(denoised, transpose(timeStamp));
%   
%     Fs = 1000;            % Sampling frequency                    
%     T = 1/Fs;             % Sampling period        
%     nfft = length(principalComponents);
%     nfft2 = 2^nextpow2(nfft);
%     ff = fft(principalComponents, nfft2);
%     fff = ff(1:nfft2/2,:);
%     xfft = Fs*(0:nfft2/2-1)/nfft2;
%     figure
%     plot(xfft,abs(fff)) 
%     title('Single-Sided Amplitude Spectrum of X(t)')
%     xlabel('f (Hz)')
%     ylabel('|P1(f)|')
% Y = fft(principalComponents);
% 
% P2 = abs(Y/nfft);
% P1 = P2(1:nfft/2+1,:);
% P1(2:end-1,:) = 2*P1(2:end-1,:);


% f = Fs*(0:(nfft/2))/nfft;

% figure
% plot(f,P1)

    %  output_matrix = denoised;
%       figure
%       plot(denoise(rmoutliers(output_matrix)))
%       output_matrix = principalComponents; 
%         figure
%     plot(principalComponents)
%     output_matrix = normalize(principalComponents); % to make the data is in proper format as an input for LSTM
   % outFile=strcat(Output_Data_Folder,name,'.mat'); %output file path is created with respect to previous filename of data.

    % During data collection, the activity data is label same number for both two
    % person data , while processing this data to save it them in same folder,
    % created file name and number is increased corresponding to data
    % number and following operation is given due to this purpose
    name = regexprep(name,'[\d"]',''); %extract filename with number 
    %depending on a condition previous function or following function is
    %utilized
    number = regexprep(name, '^(\D+)(\d+)(.*)', '$2');%extract only the number from filename
    new_number = i + str2num(number); %calculate new number according to data size
%     outFile=strcat(outFile,name,int2str(new_number),'.mat'); %create new ouput data file path

    %save(outFile,'output_matrix');  % save denoised amplitude data into created output file
end
      writematrix(csiMatrix, namecsv) 
% end
