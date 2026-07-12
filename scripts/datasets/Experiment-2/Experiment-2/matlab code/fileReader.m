function [timeStamp, denoisedMag] = fileReader(filename)
    CHIP = '4366c0';          % wifi chip (possible values 4339, 4358, 43455c0, 4366c0)
    BW = 80;                % bandwidth
    FILE = filename;% capture file
    NPKTS_MAX = 100000;       % max number of UDPs to process
    HOFFSET = 16;           % header offset
    NFFT = BW*3.2;          % fft size
    p = readpcap();
    p.open(FILE);
    n = min(length(p.all()),NPKTS_MAX);
    csi_buffstr1 = complex(zeros(n,NFFT),0);
    csi_buffstr = complex(zeros(n,NFFT),0);
    csi_mag = zeros(round(n/4),NFFT);
    csi_mag1 = zeros(1,NFFT);
    csi_mag2 = zeros(round(n/4),NFFT);
    csi_mag3 = zeros(round(n/4),NFFT);
    csi_mag4 = zeros(round(n/4),NFFT);


    csi_buffstr2 = complex(zeros(n,NFFT),0);
    csi_buffstr3 = complex(zeros(n,NFFT),0);
    csi_buffstr4 = complex(zeros(n,NFFT),0);
    
    timestamp = zeros(1,n);
    timestamp1 = zeros(1,1);
    timestamp2 = zeros(1,n);
    timestamp3 = zeros(1,n);
    timestamp4 = zeros(1,n);
    timeStampCleaned = zeros(1,1);


    [seconds, microseconds] = p.allFrames();

    firstSec = seconds{1,1};
    firstMicrosec = microseconds{1,1};
    for i = 1:n 
    %     seconds{1,i} = seconds{1,i} - firstSec;
    %     microseconds{1,i} = microseconds{1,i} - firstMicrosec;
        timestampSec(i) = double(seconds{1,i})*1000;
        timestampMirco(i) = double(microseconds{1,i})/1000;
    end

    timestampMS = timestampSec + timestampMirco;
    % 
    first = timestampMS(1,1);

    for i=1:n
        timestamp(1,i) = (timestampMS(1,i) - first); %vpa
    end

    timestampms = round(timestamp);

    p.from_start();
    csi_buff = complex(zeros(n,NFFT),0);
    csi_mag = csi_buff;
    csi_mag_clean = zeros(1,NFFT);
    k = 1;
    s = 1;
    s1 = 1;
    s2 = 1;
    s3 = 1;
    s4 = 1;
    ts = zeros(1,1);
    while (k <= n)
        f = p.next();
        if isempty(f)
            disp('no more frames');
            break;
        end
        if f.header.orig_len-(HOFFSET-1)*4 ~= NFFT*4
            disp('skipped frame with incorrect size');
            continue;
        end
        payload = f.payload;
        payload_uint8 = typecast(f.payload, 'uint8');
        magic = payload_uint8(43:43 + 4 - 1);
        sequence_no = typecast(payload_uint8(53:53 + 2 - 1), 'uint16');
        sc = swapbytes(typecast(payload_uint8(55:55 + 2 - 1), 'uint16'));    
        core = bitand(sc,7);
        stream = bitand(bitsra(sc, 3),7);
        chanspec = typecast(payload_uint8(57:57 + 2 - 1), 'uint16');
        chipversion = typecast(payload_uint8(59:59 + 2 - 1), 'uint16');
        if(size(payload,1) ~= 271)
            continue;
        end
        H = payload(HOFFSET:HOFFSET+NFFT-1);
        if (strcmp(CHIP,'4339') || strcmp(CHIP,'43455c0'))
            Hout = typecast(H, 'int16');
        elseif (strcmp(CHIP,'4358'))
            Hout = unpack_float(int32(0), int32(NFFT), H);
        elseif (strcmp(CHIP,'4366c0'))
            Hout = unpack_float(int32(1), int32(NFFT), H);
        else
            disp('invalid CHIP');
            break;
        end
        Hout = reshape(Hout,2,[]).';
        cmplx = double(Hout(1:NFFT,1))+1j*double(Hout(1:NFFT,2));
        csi_buff(k,:) = cmplx.';
        csi_mag(k,:) = abs(csi_buff(k,:));
         if(sum(abs(csi_buff(k,:)))~= 0)
            csi_mag_clean(s,:) = abs(csi_buff(k,:));
            timeStampCleaned(1,s) = timestampms(1,k);
            s = s + 1;
          end
%         if(sum(csi_mag(k,:)) > 0)
%             csi_mag_clean(index,:) = csi_mag(k,:);
%             ts(1,index)=timestampms(1,k);
%             index = index + 1;
%         end
        
        if core == 0
            csi_buffstr1(s1,:) = cmplx.';
            if (sum(abs(csi_buff(k,:)))~= 0)
                csi_mag1(s1,:) = abs(csi_buff(k,:));
                timestamp1(1,s1) = timestampms(1,k);
                s1 = s1 + 1;
            end
        end
        
        if core == 1
        csi_buffstr2(s2,:) = cmplx.';  
        csi_mag2(s2,:) = abs(csi_buff(k,:));
        timestamp2(1,s2) = timestampms(1,k);
        s2 = s2 + 1;
        end
        
        if core == 2
        csi_buffstr3(s3,:) = cmplx.';       
        csi_mag3(s3,:) = abs(csi_buff(k,:));
        timestamp3(1,s3) = timestampms(1,k);
        s3 = s3 + 1;
        end
        
        if core == 3
        csi_buffstr4(s4,:) = cmplx.';
        csi_mag4(s4,:) = abs(csi_buff(k,:));
        timestamp4(1,s4) = timestampms(1,k);
        s4 = s4 + 1;
        end
        k = k + 1;
    end
%     csiDenoised = denoise(csi_mag);
%     csiDenoised1 = denoise(csi_mag1);
%     csiDenoised2 = denoise(csi_mag2);
%     csiDenoised3 = denoise(csi_mag3);
%     figure('NumberTitle', 'off','Name','original');
%     plot(csi_mag_clean);
% %     figure('NumberTitle', 'off','Name','denoised');
% %     plot(csiDenoised);
%         figure('NumberTitle', 'off','Name','denoised');
%     plot(csiDenoised2);
%         figure('NumberTitle', 'off','Name','denoised');
%     plot(csiDenoised3);

nullSub = [1 2 3 4 5 6 128 129 130 252 253 254 255 256];
pilotSub = [26 54 90 118 140 168 204 232];
removeSub = [nullSub pilotSub];

 [y1,ps] = removerows(transpose(csi_mag_clean),'ind',removeSub);
% plotcsi(csi_mag_clean, NFFT, false)
     timeStamp = timeStampCleaned;
    denoisedMag = csi_mag_clean;%(:, 129:129+63);
%     diff = csi_mag1 - csi_mag2;
% plotcsi(denoisedMag, 234, false)

end
