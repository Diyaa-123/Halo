clear all
%% csireader.m
%
% read and plot CSI from UDPs created using the nexmon CSI extractor (nexmon.org/csi)
% modify the configuration section to your needs
% make sure you run >mex unpack_float.c before reading values from bcm4358 or bcm4366c0 for the first time
%
% the example.pcap file contains 4(core 0-1, nss 0-1) packets captured on a bcm4358
%

%% configuration
%CHIP = '43455c0';          % wifi chip (possible values 4339, 4358, 43455c0, 4366c0)
CHIP = '4366c0';          % wifi chip (possible values 4339, 4358, 43455c0, 4366c0)

BW = 80;                % bandwidth
FILE = './data/testlaststand.pcap';% capture file
NPKTS_MAX = 6000;       % max number of UDPs to process

%% read file
HOFFSET = 16;           % header offset
NFFT = BW*3.2;          % fft size
p = readpcap();
p.open(FILE);
n = min(length(p.all()),NPKTS_MAX);
p.from_start();
csi_buff = complex(zeros(n,NFFT),0);
csi_buffstr1 = complex(zeros(n,NFFT),0);
csi_mag1 = zeros(round(n/4),NFFT);
csi_mag2 = zeros(round(n/4),NFFT);
csi_mag3 = zeros(round(n/4),NFFT);
csi_mag4 = zeros(round(n/4),NFFT);


csi_buffstr2 = complex(zeros(n,NFFT),0);
csi_buffstr3 = complex(zeros(n,NFFT),0);
csi_buffstr4 = complex(zeros(n,NFFT),0);
k = 1;
[seconds, microseconds] = p.allFrames();

%%timestamp
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
timestamp1 = zeros(1,n);
timestamp2 = zeros(1,n);
timestamp3 = zeros(1,n);
timestamp4 = zeros(1,n);
%%
p.from_start();
s = 1;
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
    if stream == 0
        csi_buffstr1(s,:) = cmplx.';
        csi_mag1(s,:) = abs(csi_buff(s,:));
        timestamp1(1,s) = timestampms(1,k);
        s = s + 1;
    end
        if stream == 1
        csi_buffstr2(s,:) = cmplx.';  
        csi_mag2(s,:) = abs(csi_buff(s,:));
        timestamp2(1,s) = timestampms(1,k);
        end
        
        if stream == 2
        csi_buffstr3(s,:) = cmplx.';       
        csi_mag3(s,:) = abs(csi_buff(s,:));
        timestamp3(1,s) = timestampms(1,k);
        end
        
        if stream == 3
        csi_buffstr4(s,:) = cmplx.';
        csi_mag4(s,:) = abs(csi_buff(s,:));
        timestamp4(1,s) = timestampms(1,k);
        end
    k = k + 1;
end
figure
plot(csi_mag1(:,140))

figure
plot(csi_mag2(:,140))

figure
plot(csi_mag3(:,140))

figure
plot(csi_mag4(:,140))
%% plot
%plotcsi(csi_buff, NFFT, false)



